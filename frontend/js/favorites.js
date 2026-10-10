import { getAuthToken } from "./utils.js";

async function loadFavorites() {
    /**
     * Carga la sección de favoritos.
     */

    const token = getAuthToken()
    if (!token) return;

    const container = document.getElementById("favorites-grid");

    try {
        const response = await fetch(`${API_URL}/favorites`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("access_token");
                window.location.href = "login.html";
                return;
            }

            throw new Error("No se pudieron cargar las películas favoritas");
        }

        const movies = await response.json();
        container.innerHTML = "";

        if (movies.length === 0) { container.innerHTML = "<p>No hay películas favoritas aún.</p>"; return; }

        movies.forEach(movie => {
            const card = document.createElement("article");
            card.classList.add("movie-card");

            card.addEventListener("click", () => {
                window.location.href = `movie.html?id=${movie.id}`;
            });

            const roundedRating = Math.round(movie.avg_rating);
            const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);

            const reviewText = movie.review_count === 1 ? "1 reseña" : `${movie.review_count} reseñas`;

            card.innerHTML = `
                <img src="${movie.poster_url || ''}" alt="Póster de ${movie.title}">

                <h2>${movie.title}</h2>

                <p class="movie-meta-card"> ${movie.year} - ${movie.genre} </p>

                <div class="movie-card-rating">
                    <span class="movie-stars"> ${stars} </span>
                    <span class="movie-rating-number"> ${movie.avg_rating.toFixed(1)} </span>
                </div>

                <p class="movie-review-count">${reviewText}</p>

                <button
                    class="favorite-heart-button active"
                    type="button"
                    title="Quitar de favoritos"
                >
                    ♥
                </button>
            `;

            const favoriteButton = card.querySelector(".favorite-heart-button");

            favoriteButton.addEventListener("click", async event => {
                event.stopPropagation();
                await removeFavorite(movie.id);
            });

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = "<p>No se pudieron cargar los favoritos.</p>";
        console.error(error);
    }
}

async function removeFavorite(movieId) {
    /**
     * Elimina una película de favoritos.
     */
    const token = getAuthToken()
    if (!token) return;

    const response = await fetch(`${API_URL}/favorites/${movieId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "No se pudo eliminar de favoritos"); return; }
    await loadFavorites();
}


document.addEventListener("DOMContentLoaded", loadFavorites);