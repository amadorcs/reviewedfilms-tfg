import os

from datetime import datetime, timedelta, timezone

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from jose import JWTError, jwt
from passlib.context import CryptContext

from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.routers.utils import http_error_invalid_token, http_error_user_not_found, http_error_user_not_admin


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
JWT_TOKEN_DURATION = int(os.getenv("JWT_TOKEN_DURATION"))


password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_password_hash(password: str):
    '''Devuelve el hash del password'''
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    '''Comprueba si la contraseña coincide con el hash dados'''
    
    return password_context.verify(
        plain_password,
        hashed_password
    )

def jwt_encode(payload):
    ''' Crea un token JWT'''
    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )
    
def jwt_decode(token):
    ''' Extrae el contenido del token JWT '''
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM]
    )

def create_token_jwt(user_id: int):
    ''' Crea un token JWT para un usuario '''
    expiration = datetime.now(timezone.utc) + timedelta(minutes=JWT_TOKEN_DURATION)

    payload = {
        "sub": str(user_id),
        "exp": expiration
    }

    return jwt_encode(payload)

def get_current_user(
    token: str = Depends(oauth2_bearer),
    db: Session = Depends(get_db)
):
    ''' Obtiene el user a partir del JWT '''
    try:
        payload = jwt_decode(token)
        user_id = payload.get("sub")
        if user_id is None: http_error_invalid_token()

    except JWTError: http_error_invalid_token()

    user = db.query(models.User
    ).filter(models.User.id == int(user_id)
    ).first()

    if user is None: http_error_user_not_found()

    return user

def get_current_user_if_admin(
    current_user: models.User = Depends(
        get_current_user
    )
):
    ''' Retorna el usuario actual si es admin '''
    if not current_user.is_admin: http_error_user_not_admin()

    return current_user