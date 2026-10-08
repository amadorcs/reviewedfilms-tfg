from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.orm import Session

from app.auth import create_token_jwt, verify_password
from app.database import get_db
from app.routers.utils import (
    http_error_incorrect_credentials, 
    query_find_user_by_username
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login")
def login(
    login_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ''' Para iniciar sesión '''
    user = query_find_user_by_username(db, login_data.username)
    if user is None: http_error_incorrect_credentials()
    
    correct_password = verify_password(
        login_data.password,
        user.password_hash
    )
    if not correct_password: http_error_incorrect_credentials()

    token = create_token_jwt(user.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }