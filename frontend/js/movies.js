import { getAuthToken } from "./utils.js";

let allMovies = [];
let favoriteMovieIds = new Set();


async function loadMovies() {
    /**
     * Carga todas las películas.
     * Carga los favoritos del usuario.
     */
    const movieGrid = document.getElementById("movie-grid");

    if (!movieGrid) { return; }

    try {
        const response = await fetch(`${API_URL}/movies`);

        if (!response.ok) { throw new Error("No se pudieron cargar las películas"); }

        allMovies = await response.json();

        await loadFavorites();
        refreshMovies();

    } catch (error) {
        movieGrid.innerHTML = "<p>No se pudieron cargar las películas.</p>";
        console.error(error);
    }
}


async function loadFavorites() {
    /**
     * Carga las películas favoritas del usuario.
     */
    const token = localStorage.getItem("access_token");

    favoriteMovieIds = new Set();

    if (!token) { return; }

    try {
        const response = await fetch(`${API_URL}/favorites`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) { return; }

        const favorites = await response.json();

        favoriteMovieIds = new Set( favorites.map(movie => movie.id) );

    } catch (error) { console.error(error); }
}

function showMovie(movie, movieGrid){
    /**
     * Muestra la película pasada por parámetro.
     * Crea un recuadro con todos sus atributos.
     */
    const card = document.createElement("article");
    card.classList.add("movie-card");

    card.addEventListener("click", () => {
        window.location.href = `movie.html?id=${movie.id}`;
    });

    const roundedRating = Math.round(movie.avg_rating);
    const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    const reviewText = movie.review_count === 1 ? "1 reseña" : `${movie.review_count} reseñas`;
    const isFavorite = favoriteMovieIds.has(movie.id);

    card.innerHTML = `
        <img src="${movie.poster_url || ''}" alt="Póster de ${movie.title}">

        <h2>${movie.title}</h2>

        <p class="movie-meta-card"> ${movie.year} · ${movie.genre} </p>

        <div class="movie-card-rating">
            <span class="movie-stars">${stars}</span>

            <span class="movie-rating-number">${movie.avg_rating.toFixed(1)}</span>
        </div>

        <p class="movie-review-count">${reviewText}</p>

        <button
            class="favorite-heart-button ${isFavorite ? "active" : ""}"
            type="button"
            title="${isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}"
        >
            ${isFavorite ? "♥" : "♡"}
        </button>
    `;

    const favoriteButton = card.querySelector(".favorite-heart-button");
    favoriteButton.addEventListener("click", async event => { event.stopPropagation(); await toggleFavorite(movie.id);});
    movieGrid.appendChild(card);
}

function showMovies(movies) {
    /**
     * Muestra todas las películas que se le han pasado por parámetro.
     * Para cada película crea un recuadro con todos sus atributos.
     */
    const movieGrid = document.getElementById("movie-grid");

    if (!movieGrid) { return; }

    movieGrid.innerHTML = "";

    if (movies.length === 0) {
        movieGrid.innerHTML = "<p>No se encontraron películas.</p>";
        return;
    }

    movies.forEach(movie => {showMovie(movie, movieGrid)} );
}


async function toggleFavorite(movieId) {
    /**
     * Añade o elimina una película de favoritos.
     */
    const token = getAuthToken();
    if (!token) return;

    const isFavorite = favoriteMovieIds.has(movieId);
    const method = isFavorite ? "DELETE" : "POST";

    const response = await fetch(
        `${API_URL}/favorites/${movieId}`,
        {
            method,
            headers: { "Authorization": `Bearer ${token}` }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail || "No se pudo modificar favoritos");
        return;
    }

    if (isFavorite) { favoriteMovieIds.delete(movieId); } 
    else { favoriteMovieIds.add(movieId); }

    refreshMovies();
}


function getPopularMovies() {
    /**
     * Obtiene las 10 películas más populares.
     */
    return [...allMovies]
        .sort((a, b) => {
            if (b.avg_rating !== a.avg_rating) { return b.avg_rating - a.avg_rating; }
            return b.review_count - a.review_count;
        })
        .slice(0, 10);
}


function refreshMovies() {
    /**
     * Muestra las películas populares o todas las películas para buscar, dependiendo de
     * donde en qué sección se encuentre el usuario.
     */
    const searchInput = document.getElementById("search-input");
    const genreFilter = document.getElementById("genre-filter");
    const sortFilter = document.getElementById("sort-filter");
    const isFilmsPage = searchInput || genreFilter || sortFilter;

    if (isFilmsPage) { applyFilters(); } 
    else { showMovies(getPopularMovies()); }
}


function applyFilters() {
    /**
     * Filtra y ordena las películas en la sección de buscar película.
     */
    const searchInput = document.getElementById("search-input");
    const genreFilter = document.getElementById("genre-filter");
    const sortFilter = document.getElementById("sort-filter");
    const title = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const genre = genreFilter ? genreFilter.value : "";
    const sort = sortFilter ? sortFilter.value : "";

    let filteredMovies = allMovies.filter(movie => {
        const matchesTitle = movie.title.toLowerCase().includes(title);
        const matchesGenre = genre === "" || movie.genre === genre;
        return matchesTitle && matchesGenre;
    });

    filteredMovies = [...filteredMovies];

    switch (sort) {
        case "rating-desc":
            filteredMovies.sort((a, b) => b.avg_rating - a.avg_rating);
            break;
        case "reviews-desc":
            filteredMovies.sort((a, b) => b.review_count - a.review_count);
            break;
        case "year-desc":
            filteredMovies.sort((a, b) => b.year - a.year);
            break;
        case "year-asc":
            filteredMovies.sort((a, b) => a.year - b.year);
            break;
        case "title-asc":
            filteredMovies.sort((a, b) => a.title.localeCompare(b.title,"es"));
            break;
        case "title-desc":
            filteredMovies.sort((a, b) => b.title.localeCompare(a.title,"es"));
            break;
    }

    showMovies(filteredMovies);
}



document.addEventListener("DOMContentLoaded", () => { loadMovies();
    const searchInput = document.getElementById("search-input");
    const genreFilter = document.getElementById("genre-filter");
    const sortFilter = document.getElementById("sort-filter");
    if (searchInput) { searchInput.addEventListener("input", applyFilters); }
    if (genreFilter) { genreFilter.addEventListener( "change", applyFilters ); }
    if (sortFilter) { sortFilter.addEventListener( "change", applyFilters);}
});