from fastapi import HTTPException

from app import models

def http_error(status_code: int, detail: str):
    raise HTTPException(
            status_code=status_code,
            detail=detail
        )

def http_error_invalid_token(): http_error(401, "Token no válido")

def http_error_user_exists(): http_error(400, "El nombre de usuario ya existe")
def http_error_user_not_found(): http_error(401, "Usuario no encontrado")
def http_error_user_not_admin(): http_error(403, "El usuario no es administrador")

def http_error_email_exists(): http_error(400, "El email ya existe")

def http_error_incorrect_credentials(): http_error(401, "Credenciales incorrectas")



def query_find_user_by_username(db, username):
    return db.query(models.User).filter(
                models.User.username == username
            ).first()
    
def query_find_email(db, email):
    return db.query(models.User).filter(
                models.User.email == email
            ).first()

    
def post_behaviour(db, item):
    db.add(item)
    db.commit()
    db.refresh(item)

def put_behaviour(db, item):
    db.commit()
    db.refresh(item)

def delete_behaviour(db, item):
    db.delete(item)
    db.commit()