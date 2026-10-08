from sqlalchemy import Column,Boolean,Integer,String,Text,DateTime,ForeignKey,UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class Favorite(Base):
    __tablename__ = "favorites"
    
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        primary_key=True
    )
    
    movie_id = Column(
        Integer,
        ForeignKey(
            "movies.id",
            ondelete="CASCADE"
        ),
        primary_key=True
    )


class User(Base):
    __tablename__ = "users"
    
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )
    
    is_admin = Column(
        Boolean,
        default=False,
        nullable=False
    )
    
    username = Column(
        String(60),
        unique=True,
        nullable=False,
        index=True
    )
    
    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )
    
    password_hash = Column(
        String(255),
        nullable=False
    )
    
    reviews = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    favorite_movies = relationship(
        "Movie",
        secondary=Favorite.__table__,
        back_populates="favorite_users"
    )


class Movie(Base):
    __tablename__ = "movies"
    
    id = Column(
        Integer, 
        primary_key=True, 
        index=True
    )
    
    title = Column(
        String(150), 
        nullable=False, 
        index=True
        )
    
    duration = Column(
        Integer, 
        nullable=False
        )
    
    year = Column(
        Integer, 
        nullable=False
        )
    
    genre = Column(
        String(100), 
        nullable=False
        )
    
    synopsis = Column(
        Text, 
        nullable=False
        )

    poster_url = Column(
        String(600), 
        nullable=False
        )
    
    reviews = relationship(
        "Review",
        back_populates="movie",
        cascade="all, delete-orphan"
    )
    
    favorite_users = relationship(
        "User",
        secondary=Favorite.__table__,
        back_populates="favorite_movies"
    )


class Review(Base):
    __tablename__ = "reviews"
    
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "movie_id",
            name="unique_user_movie"
        ),
    )
    
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )
    
    rating = Column(
        Integer,
        nullable=False
    )
    
    comment = Column(
        Text,
        nullable=False
    )
    
    creation_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    
    movie_id = Column(
        Integer,
        ForeignKey("movies.id"),
        nullable=False
    )
    
    user = relationship(
        "User",
        back_populates="reviews"
    )
    
    movie = relationship(
        "Movie",
        back_populates="reviews"
    )
