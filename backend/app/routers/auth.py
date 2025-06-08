from datetime import timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Form
from fastapi.security import OAuth2PasswordRequestForm as FastAPIOAuth2PasswordRequestForm
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..models.user import User, UserCreate, Token, EmailVerification, UserDB
from ..services.auth import (
    create_access_token,
    get_current_active_user,
    create_user,
    authenticate_user,
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    setup_2fa,
    verify_2fa,
)
from ..config import settings
from ..database import get_db
from ..services.email import send_verification_email

class OAuth2PasswordRequestForm(FastAPIOAuth2PasswordRequestForm):
    def __init__(
        self,
        totp: str | None = Form(default=None),
        grant_type: str = Form(default=None, regex="password"),
        username: str = Form(),
        password: str = Form(),
        scope: str = Form(default=""),
        client_id: str | None = Form(default=None),
        client_secret: str | None = Form(default=None),
    ):
        self.totp = totp
        super().__init__(
            grant_type=grant_type,
            username=username,
            password=password,
            scope=scope,
            client_id=client_id,
            client_secret=client_secret,
        )

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/register", response_model=User)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Vérifier si l'utilisateur existe déjà
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Créer un token de vérification
    verification_token = secrets.token_urlsafe(32)
    
    # Créer l'utilisateur
    db_user = create_user(db, user)
    db_user.verification_token = verification_token
    db.commit()

    # Envoyer l'email de vérification
    send_verification_email(db_user.email, verification_token)

    # Retourner l'utilisateur nouvellement créé
    return db_user

@router.post("/verify-email")
async def verify_email(verification: EmailVerification, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.verification_token == verification.token).first()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification token"
        )
    
    user.is_verified = True
    user.verification_token = None
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/setup-2fa")
async def setup_twofa(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    qr = setup_2fa(db, current_user)
    return {"qr": qr}


class TwoFAToken(BaseModel):
    token: str


@router.post("/verify-2fa")
async def verify_twofa(
    data: TwoFAToken,
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if verify_2fa(current_user, data.token):
        current_user.is_twofa_enabled = True
        db.commit()
        return {"message": "2FA enabled"}
    raise HTTPException(status_code=400, detail="Invalid two factor code")

@router.post(
    "/token",
    response_model=Token,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_twofa_enabled:
        if not form_data.totp or not verify_2fa(user, form_data.totp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid two factor code",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(db, user)
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        samesite="strict",
        secure=not settings.DEBUG,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        samesite="strict",
        secure=not settings.DEBUG,
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/refresh-token", response_model=Token)
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    existing = request.cookies.get("refresh_token")
    if not existing:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    user = verify_refresh_token(db, existing)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    revoke_refresh_token(db, existing)
    new_refresh = create_refresh_token(db, user)
    response.set_cookie(
        "refresh_token",
        new_refresh,
        httponly=True,
        samesite="strict",
        secure=not settings.DEBUG,
    )
    access = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        samesite="strict",
        secure=not settings.DEBUG,
    )
    return Token(access_token=access, token_type="bearer")


@router.post("/logout")
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if token:
        revoke_refresh_token(db, token)
    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    return {"message": "Logged out"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user 
