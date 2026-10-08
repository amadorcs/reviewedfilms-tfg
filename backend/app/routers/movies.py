from fastapi import Depends, APIRouter

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user_if_admin
from app.database import get_db
from app.routers.utils import (
    http_error_movie_not_found, 
    query_find_movie_by_id,
    post_behaviour, put_behaviour, delete_behaviour
    )


router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


def movie_to_response(
    movie: models.Movie,
    db: Session
):
    '''Retorna la respuesta de la película que será enviada al frontend'''
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
def get_movies(
    db: Session = Depends(get_db)
):
    ''' Retorna todas las películas '''
    movies = db.query(models.Movie).all()

    return [movie_to_response(movie, db) for movie in movies]


@router.post("", response_model=schemas.MovieGet)
def create_movie(
    movie: schemas.MoviePost,
    db: Session = Depends(get_db),
    check_user_is_admin: models.User = Depends(get_current_user_if_admin)
):
    '''Crea una película'''
    new_movie = models.Movie(
        title=movie.title,
        year=movie.year,
        duration=movie.duration,
        genre=movie.genre,
        synopsis=movie.synopsis,
        poster_url=movie.poster_url
    )

    post_behaviour(db, new_movie)

    return movie_to_response(new_movie, db)


@router.put("/{movie_id}", response_model=schemas.MovieGet)
def update_movie(
    movie_id: int,
    movie_data: schemas.MoviePut,
    db: Session = Depends(get_db),
    check_user_is_admin: models.User = Depends(get_current_user_if_admin)
):
    '''Actualiza una película'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()
    
    movie.title = movie_data.title
    movie.year = movie_data.year
    movie.duration = movie_data.duration
    movie.genre = movie_data.genre
    movie.synopsis = movie_data.synopsis
    movie.poster_url = movie_data.poster_url

    put_behaviour(db, movie)

    return movie_to_response(movie, db)


@router.delete("/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    check_user_is_admin: models.User = Depends(get_current_user_if_admin)
):
    '''Elimina una película'''
    movie = query_find_movie_by_id(db, movie_id)
    if movie is None: http_error_movie_not_found()

    delete_behaviour(db, movie)

    return { "detail": "La película ha sido eliminada correctamente" }