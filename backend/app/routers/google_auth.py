from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models.user import UserDB, UserRole
from ..services.auth import create_access_token, create_refresh_token
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/auth/google",
    tags=["google-auth"]
)

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'openid email profile',
        'redirect_uri': settings.GOOGLE_REDIRECT_URI
    }
)

@router.get("/login")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI or request.url_for('google_auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = await oauth.google.parse_id_token(request, token)
        
        # Vérifier si l'utilisateur existe déjà
        user = db.query(UserDB).filter(UserDB.email == userinfo['email']).first()
        
        if not user:
            # Créer un nouvel utilisateur
            user = UserDB(
                email=userinfo['email'],
                full_name=userinfo.get('name', ''),
                is_verified=True,  # L'email est déjà vérifié par Google
                is_google_user=True,
                google_id=userinfo.get('sub'),  # ID unique Google
                hashed_password=None,  # Pas de mot de passe pour les utilisateurs Google
                role=UserRole.client,
                last_login_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Mettre à jour les informations de l'utilisateur existant
            user.is_google_user = True
            user.google_id = userinfo.get('sub')
            user.is_verified = True
            user.last_login_at = datetime.utcnow()
            db.commit()
        
        # Créer un token JWT et un refresh token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires,
        )
        refresh_token = create_refresh_token(db, user)

        # Créer la réponse de redirection et y attacher les cookies
        response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        )
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
        return response
        
    except OAuthError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        ) 