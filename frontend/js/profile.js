import { formatReviewDate, getAuthToken } from "./utils.js";

let profileReviews = [];
let editingReviewId = null;


async function loadProfile() {
    /**
     * Carga los datos del usuario junto con sus reseñas
     */
    const token = getAuthToken()
    if (!token) return; 

    const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!userResponse.ok) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    const user = await userResponse.json();

    document.getElementById("profile-username").textContent = user.username;
    document.getElementById("profile-email").textContent = user.email;

    const reviewsResponse = await fetch(`${API_URL}/reviews/me`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!reviewsResponse.ok) { return; }

    profileReviews = await reviewsResponse.json();

    renderProfileReviews();
}


function renderProfileReviews() {
    /**
     * Muestra todas las reseñas del usuario en el perfil
     */
    const container = document.getElementById("profile-reviews-container");

    container.innerHTML = "";

    if (profileReviews.length === 0) {
        container.innerHTML = "<p>Todavía no has publicado reseñas.</p>";
        return;
    }

    profileReviews.forEach(review => {
        if (editingReviewId === review.id) { renderEditForm(review, container); return; }

        const article = document.createElement("article");

        article.classList.add("profile-review-card");

        article.innerHTML = `
            <div class="profile-review-info">
                <h3>${review.movie_title}</h3>

                <p class="rating">
                    ${"★".repeat(review.rating)}
                    ${"☆".repeat(5 - review.rating)}
                </p>

                <p class="review-text"> ${review.comment} </p>

                <p class="review-date"> ${formatReviewDate(review.creation_date)} </p>
            </div>

            <div class="profile-review-actions">
                <button class="edit-button" type="button"> Editar </button>
                <button class="delete-button" type="button"> Eliminar </button>
            </div>
        `;

        article.querySelector(".edit-button").addEventListener("click",() => startEditReview(review.id));
        article.querySelector(".delete-button").addEventListener("click",() => deleteReview(review.id));
        container.appendChild(article);
    });
}


function renderEditForm(review, container) {
    /**
     * Muestra el recuadro para editar una reseña especificada por el usuario dentro del perfil.
     */
    const article = document.createElement("article");

    article.classList.add("profile-review-edit");
    article.innerHTML = `
        <h3> Editar reseña de ${review.movie_title} </h3>

        <label for="edit-rating-${review.id}"> Puntuación </label>
        <select id="edit-rating-${review.id}">
            <option value="1">1 estrella</option>
            <option value="2">2 estrellas</option>
            <option value="3">3 estrellas</option>
            <option value="4">4 estrellas</option>
            <option value="5">5 estrellas</option>
        </select>

        <label for="edit-content-${review.id}"> Reseña </label>
        <textarea id="edit-content-${review.id}" rows="6"></textarea>

        <div class="profile-edit-actions">
            <button class="save-edit-button" type="button"> Guardar cambios </button>
            <button class="cancel-edit-button" type="button"> Cancelar </button>
        </div>
    `;

    container.appendChild(article);

    document.getElementById(`edit-rating-${review.id}`).value = review.rating;
    document.getElementById(`edit-content-${review.id}`).value = review.comment;

    article.querySelector(".save-edit-button").addEventListener("click", () => saveReview(review.id));
    article.querySelector(".cancel-edit-button").addEventListener("click", cancelEditReview);
}


function startEditReview(reviewId) {
    /**
     * Pone una reseña en modo edición.
     */
    editingReviewId = reviewId;
    renderProfileReviews();
}

function cancelEditReview() {
    /**
    * Cancela la edición de una reseña.
    */ 
    editingReviewId = null;
    renderProfileReviews();
}


async function saveReview(reviewId) {
    /**
     * Guarda los cambios realizados en la edición de una reseña especificada.
     */
    const token = localStorage.getItem("access_token");
    const rating = parseInt(document.getElementById(`edit-rating-${reviewId}`).value);
    const comment = document.getElementById(`edit-content-${reviewId}`).value.trim();
    if (!comment) { alert("La reseña no puede estar vacía"); return; }

    const response = await fetch(
        `${API_URL}/reviews/${reviewId}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ rating, comment })
        }
    );

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "No se pudo editar la reseña"); return; }

    editingReviewId = null;

    await loadProfile();
}


async function deleteReview(reviewId) {
    /**
     * Elimina la reseña especificada desde el perfil.
     */
    const token = localStorage.getItem("access_token");

    if (!confirm("¿Seguro que quieres eliminar esta reseña?")) { return; }

    const response = await fetch(
        `${API_URL}/reviews/${reviewId}`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "No se pudo eliminar la reseña"); return; }

    editingReviewId = null;

    await loadProfile();
}



function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "index.html";
}



document.addEventListener("DOMContentLoaded", loadProfile);