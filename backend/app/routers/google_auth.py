from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models.user import UserDB
from ..services.auth import create_access_token, create_refresh_token
from datetime import timedelta

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
                hashed_password=None  # Pas de mot de passe pour les utilisateurs Google
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Mettre à jour les informations de l'utilisateur existant
            user.is_google_user = True
            user.google_id = userinfo.get('sub')
            user.is_verified = True
            db.commit()
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": user.email},
            expires_delta=refresh_token_expires
        )

        response = RedirectResponse(url="http://localhost:4200/home")
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            max_age=int(access_token_expires.total_seconds()),
            samesite="lax",
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            max_age=int(refresh_token_expires.total_seconds()),
            samesite="lax",
        )
        return response
        
    except OAuthError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        ) 