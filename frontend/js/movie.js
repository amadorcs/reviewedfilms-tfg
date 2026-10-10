import { formatReviewDate, getAuthToken } from "./utils.js";

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

let isFavorite = false;
let currentUser = null;
let currentUserReview = null;
let isEditingReview = false;


async function loadMovie() {
    /**
     * Carga los datos de una película específica y los enseña.
     */
    const response = await fetch(`${API_URL}/movies/${movieId}`);
    if (!response.ok) { alert("No se pudo cargar la película"); return; }

    const movie = await response.json();

    document.getElementById("movie-title").textContent = movie.title;
    document.getElementById("movie-meta").textContent = `${movie.year} · ${movie.genre} · ${movie.duration} min`;
    document.getElementById("movie-synopsis").textContent = movie.synopsis;
    document.getElementById("movie-poster").src = movie.poster_url || "";

    const roundedRating = Math.round(movie.avg_rating);

    const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);

    document.getElementById("movie-rating-stars").textContent = stars;
    document.getElementById("movie-rating-average").textContent = movie.avg_rating.toFixed(1);
    document.getElementById("movie-review-count").textContent = movie.review_count === 1 ? "1 reseña" : `${movie.review_count} reseñas`;
}


async function loadCurrentUser() {
    /**
     * Obtiene los datos del usuario actual.
     */
    const token = localStorage.getItem("access_token");
    if (!token) { currentUser = null; return; }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) { currentUser = null; return; }

        currentUser = await response.json();

    } catch (error) {
        console.error(error);
        currentUser = null;
    }
}


async function loadFavoriteStatus() {
    /**
     * Comprueba si la película actual es favorita.
     */
    const token = localStorage.getItem("access_token");
    if (!token) {
        isFavorite = false;
        updateFavoriteButton();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/favorites`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) { return; }

        const favorites = await response.json();

        isFavorite = favorites.some( movie => movie.id === Number(movieId) );
        updateFavoriteButton();

    } catch (error) { console.error(error); }
}


function updateFavoriteButton() {
    /**
     * Modifica el botón (corazón) de favoritos dependiendo de si la película es favorita o no
     */
    const button = document.getElementById("favorite-button");

    if (isFavorite) {
        button.textContent = "♥";
        button.classList.add("active");
        button.title = "Quitar de favoritos";
    } else {
        button.textContent = "♡";
        button.classList.remove("active");
        button.title = "Añadir a favoritos";
    }
}


async function toggleFavorite() {
    /**
     * Añade o elimina la película de favoritos.
     */
    const token = getAuthToken();
    if (!token) {
        alert("Debes iniciar sesión");
        return;
    }

    const method = isFavorite ? "DELETE" : "POST";

    const response = await fetch(
        `${API_URL}/favorites/${movieId}`,
        {
            method,
            headers: { "Authorization": `Bearer ${token}`}
        }
    );

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail || "favoritos no pudo ser modificado");
        return;
    }

    isFavorite = !isFavorite;
    updateFavoriteButton();
}


function resetReviewForm() {
    /**
     * Resetea el recuadro de la reseña a su estado inicial.
     */
    document.getElementById("review-form-title").textContent = "Escribe una reseña";
    document.getElementById("submit-review-button").textContent = "Publicar reseña";
    document.getElementById("cancel-edit-button").style.display = "none";
    document.getElementById("rating").value = "1";
    document.getElementById("review-text").value = "";
}


function showMyReview() {
    /**
     * Muestra la reseña publicada del usuario o el recuadro para crearla si no tiene.
     */
    const myReviewContainer = document.getElementById("my-review-container");
    const reviewFormSection = document.getElementById("review-form-section");
    myReviewContainer.innerHTML = "";

    if (!currentUserReview) {
        isEditingReview = false;

        myReviewContainer.style.display = "none";
        reviewFormSection.style.display = "block";

        resetReviewForm();
        return;
    }

    if (isEditingReview) return; 

    myReviewContainer.style.display = "block";
    reviewFormSection.style.display = "none";

    const article = document.createElement("article");
    article.classList.add("my-review-card");

    article.innerHTML = `
        <h2>Tu reseña</h2>

        <div class="my-review-header">
            <span class="my-review-rating">
                ${"★".repeat(currentUserReview.rating)}
                ${"☆".repeat(5 - currentUserReview.rating)}
            </span>
        </div>

        # -----------------------------------------
        //VULNERABILIDAD: El contenido de la reseña es insertado directamente mediante innerHTML.
        <p class="my-review-text"> ${currentUserReview.comment} </p>
        # -----------------------------------------

        <p class="review-date"> ${formatReviewDate(currentUserReview.creation_date)} </p>

        <div class="my-review-actions">
            <button class="edit-review-button" type="button">Editar</button>
            <button class="delete-review-button" type="button">Eliminar</button>
        </div>
    `;

    article.querySelector(".edit-review-button")
    .addEventListener("click", editMyReview);

    article.querySelector(".delete-review-button")
    .addEventListener("click", deleteMyReview);

    myReviewContainer.appendChild(article);
}


function editMyReview() {
    /**
     * Pone el recuadro de la reseña del usuario en modo edición con los datos que ya tiene.
     */
    if (!currentUserReview) { return; }

    isEditingReview = true;

    const myReviewContainer = document.getElementById("my-review-container");
    const reviewFormSection = document.getElementById("review-form-section");

    myReviewContainer.style.display = "none";
    reviewFormSection.style.display = "block";

    document.getElementById("review-form-title").textContent = "Editar tu reseña";
    document.getElementById("submit-review-button").textContent = "Guardar cambios";
    document.getElementById("cancel-edit-button").style.display = "inline-block";
    document.getElementById("rating").value = currentUserReview.rating;
    document.getElementById("review-text").value = currentUserReview.comment;
}


function cancelEditMyReview() {
    /**
     * Cancela la edición de una reseña.
     */
    isEditingReview = false;
    resetReviewForm();
    showMyReview();
}


async function loadReviews() {
    /**
     * Carga las reseñas de la película de todos los usuarios y pone la reseña del usuario actual como la primera.
     */
    const response = await fetch(
        `${API_URL}/movies/${movieId}/reviews`
    );

    if (!response.ok) { return; }

    const reviews = await response.json();
    const container = document.getElementById("reviews-container");

    container.innerHTML = "";
    currentUserReview = null;

    if (currentUser) { currentUserReview = reviews.find( review => review.user_id === currentUser.id ) || null; }

    showMyReview();

    const otherReviews = currentUser ? reviews.filter( review => review.user_id !== currentUser.id) : reviews;

    if (otherReviews.length === 0) {
        container.innerHTML = "<p>No hay reseñas de otros usuarios todavía.</p>";
        return;
    }

    otherReviews.forEach(review => {
        const article = document.createElement("article");
        article.classList.add("review");

        article.innerHTML = `
            <div class="review-header">
                
            # -----------------------------------------
                //VULNERABILIDAD: username y comment son insertados directamente mediante innerHTML.
                <strong> ${review.username} </strong>

                <span>
                    ${"★".repeat(review.rating)}
                    ${"☆".repeat(5 - review.rating)}
                </span>
            </div>

            <p> ${review.comment} </p>

            # -----------------------------------------

            <p class="review-date"> ${formatReviewDate(review.creation_date)} </p>
        `;

        container.appendChild(article);
    });
}


async function submitReview(event) {
    /**
     * Decide si crear o modificar la reseña.
     */
    event.preventDefault();

    if (isEditingReview) { await updateMyReview();
    } else { await createReview(); }
}


async function createReview() {
    /**
     * Crea una reseña para la película.
     */
    const rating = parseInt( document.getElementById("rating").value );

    const comment = document.getElementById("review-text").value;

    const token = getAuthToken();
    if (!token) {
        alert("Debes iniciar sesión");
        return;
    }

    const response = await fetch(
        `${API_URL}/movies/${movieId}/reviews`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ rating, comment })
        }
    );

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "Error al publicar la reseña"); return; }

    isEditingReview = false;

    await loadReviews();
    await loadMovie();
}


async function updateMyReview() {
    /**
     * Actualiza la reseña existente del usuario actual.
     */
    if (!currentUserReview) { return; }

    const token = localStorage.getItem("access_token");
    const rating = parseInt( document.getElementById("rating").value );
    const comment = document.getElementById("review-text").value;
    const response = await fetch(
        `${API_URL}/reviews/${currentUserReview.id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ rating, comment })
        }
    );

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "No se pudo editar la reseña"); return; }

    isEditingReview = false;

    await loadReviews();
    await loadMovie();
}


async function deleteMyReview() {
    /**
     * Elimina la reseña del usuario actual.
     */
    if (!currentUserReview) { return; }

    const token = localStorage.getItem("access_token");

    if (!confirm("¿Seguro que quieres eliminar tu reseña?")) { return; }

    const response = await fetch(
        `${API_URL}/reviews/${currentUserReview.id}`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "No se pudo eliminar la reseña"); return; }

    currentUserReview = null;
    isEditingReview = false;

    await loadReviews();
    await loadMovie();
}


document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentUser();
    await loadMovie();
    await loadReviews();
    await loadFavoriteStatus();

    document.getElementById("favorite-button").addEventListener( "click", toggleFavorite );

    document.getElementById("cancel-edit-button").style.display = "none";

    document.getElementById("review-form").addEventListener("submit", submitReview);
    document.getElementById("cancel-edit-button").addEventListener("click", cancelEditMyReview);
});