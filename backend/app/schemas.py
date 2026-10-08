from pydantic import BaseModel

from datetime import datetime

'''
-----------------------------
Usuarios
-----------------------------
'''
class UserPost(BaseModel):
    username: str
    email: str
    password: str

class UserGet(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    
    class Config:
        from_attributes = True


'''
-----------------------------
Películas
-----------------------------
'''
class MoviePost(BaseModel):
    title: str
    duration: int
    year: int
    
    genre: str
    synopsis: str
    
    poster_url: str

class MoviePut(BaseModel):
    title: str
    duration: int
    year: int
    
    genre: str
    synopsis: str
    
    poster_url: str

class MovieGet(BaseModel):
    id: int
    title: str
    duration: int
    year: int
    
    genre: str
    synopsis: str
    
    poster_url: str
    
    avg_rating: float = 0.0
    review_count: int = 0
    
    class Config:
        from_attributes = True

'''
-----------------------------
Reseñas
-----------------------------
'''
class ReviewPost(BaseModel):
    rating: int
    comment: str

class ReviewPut(BaseModel):
    rating: int
    comment: str
    
class ReviewGet(BaseModel):
    id: int
    rating: int
    comment: str
    
    creation_date: datetime
    
    user_id: int
    username: str
    
    movie_id: int
    movie_title: str