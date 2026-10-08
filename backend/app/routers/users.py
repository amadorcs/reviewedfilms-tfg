from fastapi import Depends, APIRouter

from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_password_hash
from app.database import get_db
from app.routers.utils import (
    http_error_user_exists, http_error_email_exists,
    query_find_user_by_username, query_find_email,
    post_behaviour
    )


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/register", response_model=schemas.UserGet)
def register_user(
    user: schemas.UserPost,
    db: Session = Depends(get_db)
):
    ''' Registra un nuevo usuario '''
    existing_user = query_find_user_by_username(db, user.username)
    if existing_user: http_error_user_exists()

    existing_email = query_find_email(db, user.email)
    if existing_email: http_error_email_exists()

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password)
    )

    post_behaviour(db, new_user)

    return new_user


@router.get("/me", response_model=schemas.UserGet)
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    '''Retorna el usuario actual'''
    return current_user