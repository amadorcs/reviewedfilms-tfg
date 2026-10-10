import { getAuthToken } from "./utils.js";


async function checkAdminAccess() {
    /**
     * Comprueba que el usuario sea administrador.
     */
    const token = getAuthToken();
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem("access_token");
            window.location.href = "login.html";
            return false;
        }

        const user = await response.json();

        if (!user.is_admin) {
            alert("No tienes permisos de administrador");
            window.location.href = "index.html";
            return false;
        }

        return true;

    } catch (error) {
        console.error(error);
        window.location.href = "index.html";
        return false;
    }
}


async function loadAdminMovies() {
    /**
     * Carga todas las películas en la sección de administración.
     * Crea un recuadro para cada película creada.
     */
    const container = document.getElementById("admin-movies-container");

    try {
        const response = await fetch(`${API_URL}/movies`);

        if (!response.ok) { throw new Error("No se pudieron cargar las películas"); }

        const movies = await response.json();
        container.innerHTML = "";

        if (movies.length === 0) {
            container.innerHTML = "<p>No hay películas registradas.</p>";
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement("article");
            card.classList.add("admin-movie-card");

            card.innerHTML = `
                <div class="admin-movie-info">
                    <h3>${movie.title}</h3>
                    <p>
                        ${movie.year} -
                        ${movie.genre} -
                        ${movie.duration} min
                    </p>
                </div>

                <div class="admin-movie-actions">
                    <button class="edit-button" type="button">Editar</button>
                    <button class="delete-button" type="button">Eliminar</button>
                </div>
            `;

            card.querySelector(".edit-button").addEventListener("click", () => editMovie(movie.id));

            card.querySelector(".delete-button").addEventListener("click", () => deleteMovie(movie.id));

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = "<p>No se pudieron cargar las películas.</p>";
        console.error(error);
    }
}


async function createMovie(event) {
    /**
     * Da la opción de crear una nueva película.
     */
    event.preventDefault();

    const token = getAuthToken();

    const movie = {
        title: document.getElementById("title").value,
        year: parseInt(document.getElementById("year").value),
        duration: parseInt(document.getElementById("duration").value),
        genre: document.getElementById("genre").value,
        synopsis: document.getElementById("synopsis").value,
        poster_url: document.getElementById("poster-url").value
    };

    const response = await fetch(`${API_URL}/movies`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(movie)
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail || "No se pudo crear la película");
        return;
    }

    document.getElementById("movie-form").reset();
    await loadAdminMovies();
}


async function editMovie(movieId) {
    /**
     * Da la opción de poder editar una película, manteniendo todos los datos de la misma en la edición.
     */
    const response = await fetch(`${API_URL}/movies/${movieId}`);
    if (!response.ok) {
        alert("No se pudo cargar la película");
        return;
    }

    const movie = await response.json();

    document.getElementById("edit-movie-id").value = movie.id;
    document.getElementById("edit-title").value = movie.title;
    document.getElementById("edit-year").value = movie.year;
    document.getElementById("edit-duration").value = movie.duration;
    document.getElementById("edit-genre").value = movie.genre;
    document.getElementById("edit-synopsis").value = movie.synopsis;
    document.getElementById("edit-poster-url").value = movie.poster_url || "";

    const editSection = document.getElementById("edit-movie-section");

    editSection.hidden = false;

    editSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


async function updateMovie(event) {
    /**
     * Guarda los cambios realizados en la edición de una película.
     */
    event.preventDefault();

    const token = getAuthToken();
    const movieId = document.getElementById("edit-movie-id").value;

    const updatedMovie = {
        title: document.getElementById("edit-title").value,
        year: parseInt(document.getElementById("edit-year").value),
        duration: parseInt(document.getElementById("edit-duration").value),
        genre: document.getElementById("edit-genre").value,
        synopsis: document.getElementById("edit-synopsis").value,
        poster_url: document.getElementById("edit-poster-url").value
    };

    const response = await fetch(`${API_URL}/movies/${movieId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedMovie)
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail || "No se pudo editar la película");
        return;
    }

    cancelEdit();
    await loadAdminMovies();
}


function cancelEdit() {
    /**
     * Cancela la edición de una película.
     */
    const editForm = document.getElementById("edit-movie-form");
    const editSection = document.getElementById("edit-movie-section");

    editForm.reset();
    document.getElementById("edit-movie-id").value = "";
    editSection.hidden = true;
}


async function deleteMovie(movieId) {
    /**
     * Elimina una película.
     */
    const token = getAuthToken();

    if (!confirm("¿Seguro que quieres eliminar esta película?")) { return; }

    const response = await fetch(`${API_URL}/movies/${movieId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.detail || "No se pudo eliminar la película");
        return;
    }

    const editMovieId = document.getElementById("edit-movie-id").value;

    if (editMovieId && parseInt(editMovieId) === movieId) { cancelEdit(); }

    await loadAdminMovies();
}


document.addEventListener("DOMContentLoaded", async () => {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return; 

    document.getElementById("movie-form").addEventListener( "submit", createMovie );
    document.getElementById("edit-movie-form").addEventListener( "submit", updateMovie );
    document.getElementById("cancel-edit-button").addEventListener( "click", cancelEdit );

    await loadAdminMovies();
});