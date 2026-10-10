from fastapi import Depends, APIRouter

from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.routers.utils import (
    http_error_movie_not_found, http_error_review_found, http_error_review_not_found, 
    query_find_movie_by_id, query_find_review_by_id,
    post_behaviour, put_behaviour, delete_behaviour
    )


router = APIRouter(
    tags=["Reviews"]
)

def review_to_response(review: models.Review):
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "creation_date": review.creation_date,
        "user_id": review.user_id,
        "movie_id": review.movie_id,
        "username": review.user.username,
        "movie_title": review.movie.title
    }


@router.post("/movies/{movie_id}/reviews", response_model=schemas.ReviewGet)
def create_review(
    movie_id: int,
    review: schemas.ReviewPost,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Crea una review en una película'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()

    existing_review = db.query(models.Review).filter(
        models.Review.user_id == current_user.id,
        models.Review.movie_id == movie_id
        ).first()
    if existing_review is not None: http_error_review_found()

    new_review = models.Review(
        rating=review.rating,
        comment=review.comment,
        user_id=current_user.id,
        movie_id=movie_id
    )

    post_behaviour(db, new_review)

    return review_to_response(new_review)


@router.get("/movies/{movie_id}/reviews", response_model=list[schemas.ReviewGet])
def get_movie_reviews(
    movie_id: int,
    db: Session = Depends(get_db)
):
    '''Retorna todas las reviews'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()

    reviews = db.query(models.Review).filter(
        models.Review.movie_id == movie_id
    ).all()

    return [review_to_response(review) for review in reviews]


@router.get("/reviews/me", response_model=list[schemas.ReviewGet])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Obtener las reviews del usuario'''
    reviews = db.query(models.Review).filter(
        models.Review.user_id == current_user.id
    ).all()

    return [review_to_response(review) for review in reviews]


@router.put("/reviews/{review_id}", response_model=schemas.ReviewGet)
def update_review(
    review_id: int,
    review_data: schemas.ReviewPut,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Actualiza la reseña especificada'''
    
    # -----------------------------------------
    # VULNERABILIDAD: No es comprobado que la reseña que se está actualizando pertenece al usuario que quiere modificarla.
    review = query_find_review_by_id(db, review_id)
    if review is None: http_error_review_not_found()
    # -----------------------------------------

    review.rating = review_data.rating
    review.comment = review_data.comment

    put_behaviour(db, review)

    return review_to_response(review)


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Borra la reseña especificada'''
    # -----------------------------------------
    # VULNERABILIDAD: No es comprobado que la reseña que se está actualizando pertenece al usuario que quiere modificarla.
    review = query_find_review_by_id(db, review_id)
    if review is None: http_error_review_not_found()
    # -----------------------------------------

    delete_behaviour(db, review)

    return { "detail": "Reseña eliminada" }