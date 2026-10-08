from fastapi import Depends, APIRouter

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.routers.utils import (
    http_error_movie_not_found, http_error_movie_is_favorite, http_error_movie_is_not_favorite,
    query_find_movie_by_id
)


router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"]
)


def movie_to_response(
    movie: models.Movie,
    db: Session
):
    stats = db.query(
        func.avg(models.Review.rating),
        func.count(models.Review.id)
    ).filter(
        models.Review.movie_id == movie.id
    ).first()

    avg_rating = stats[0] or 0
    review_count = stats[1] or 0

    return {
        "id": movie.id,
        "title": movie.title,
        "year": movie.year,
        "duration": movie.duration,
        "genre": movie.genre,
        "synopsis": movie.synopsis,
        "poster_url": movie.poster_url,
        "avg_rating": round(float(avg_rating), 1),
        "review_count": review_count
    }


@router.get("", response_model=list[schemas.MovieGet])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Retorna todas las películas favoritas del usuario'''
    return [movie_to_response(movie, db) for movie in current_user.favorite_movies]


@router.post("/{movie_id}", response_model=schemas.MovieGet)
def add_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Añade una película a favoritos'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()
    if movie in current_user.favorite_movies: http_error_movie_is_favorite()

    current_user.favorite_movies.append(movie)
    db.commit()

    return movie_to_response(movie, db)


@router.delete("/{movie_id}")
def delete_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    '''Elimina una película de favoritos'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()
    if movie not in current_user.favorite_movies: http_error_movie_is_not_favorite()

    current_user.favorite_movies.remove(movie)
    db.commit()

    return { "detail": "La película ha sido eliminada de favoritos" }