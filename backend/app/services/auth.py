from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..models.user import User, UserCreate, TokenData, UserDB, UserRole
from ..config import settings
from ..database import get_db
from secrets import token_urlsafe
from ..models.refresh_token import RefreshTokenDB
from ..models.password_reset import PasswordResetTokenDB

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token",
    auto_error=False,
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_role(*roles: UserRole):
    """FastAPI dependency factory to ensure the current user has one of the given roles."""

    async def dependency(current_user: UserDB = Depends(get_current_active_user)) -> UserDB:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user

    return dependency

async def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> Optional[UserDB]:
    try:
        return await get_current_user(request, db, token)
    except HTTPException:
        return None

def get_user_by_email(db: Session, email: str) -> Optional[UserDB]:
    return db.query(UserDB).filter(UserDB.email == email).first()

def create_user(db: Session, user: UserCreate) -> UserDB:
    hashed_password = get_password_hash(user.password)
    db_user = UserDB(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=UserRole.client,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[UserDB]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user
def create_refresh_token(db: Session, user: UserDB) -> str:
    token = token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshTokenDB(token=token, user_id=user.id, expires_at=expires)
    db.add(db_token)
    db.commit()
    return token


def verify_refresh_token(db: Session, token: str) -> Optional[UserDB]:
    db_token = (
        db.query(RefreshTokenDB)
        .filter(RefreshTokenDB.token == token, RefreshTokenDB.revoked.is_(False))
        .first()
    )
    if not db_token:
        return None
    if db_token.expires_at and db_token.expires_at < datetime.utcnow():
        return None
    return db.query(UserDB).filter(UserDB.id == db_token.user_id).first()


def revoke_refresh_token(db: Session, token: str) -> None:
    db_token = db.query(RefreshTokenDB).filter(RefreshTokenDB.token == token).first()
    if db_token:
        db_token.revoked = True
        db.commit()

def create_password_reset_token(db: Session, user: UserDB) -> str:
    """Create and store a password reset token for the given user."""
    token = token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    db_token = PasswordResetTokenDB(token=token, user_id=user.id, expires_at=expires)
    db.add(db_token)
    db.commit()
    return token


def verify_password_reset_token(token: str, db: Session) -> Optional[UserDB]:
    """Return the user linked to the token if valid and not expired/revoked."""

    db_token = (
        db.query(PasswordResetTokenDB)
        .filter(PasswordResetTokenDB.token == token, PasswordResetTokenDB.revoked.is_(False))
        .first()
    )
    if not db_token:
        return None
    if db_token.expires_at and db_token.expires_at < datetime.utcnow():
        return None
    return db.query(UserDB).filter(UserDB.id == db_token.user_id).first()


def setup_twofa(db: Session, user: UserDB) -> str:
    """Generate and store a TOTP secret for the user."""
    import pyotp

    secret = pyotp.random_base32()
    user.twofa_secret = secret
    user.is_twofa_enabled = False
    db.commit()
    db.refresh(user)
    return secret


def verify_twofa(db: Session, user: UserDB, code: str, activate: bool = False) -> bool:
    """Verify a TOTP code. Optionally activate 2FA for the user."""
    import pyotp

    if not user.twofa_secret:
        return False

    totp = pyotp.TOTP(user.twofa_secret)
    valid = totp.verify(code)
    if valid and activate and not user.is_twofa_enabled:
        user.is_twofa_enabled = True
        db.commit()
    return valid
