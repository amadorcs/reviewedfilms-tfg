function showGuestNav(nav) {
    /**
     * Muestra el menú de navegación cuando el usuario no ha iniciado sesión
     */
    nav.innerHTML = `
        <div class="nav-center">
            <a href="index.html">Inicio</a>
            <a href="films.html">Films</a>
        </div>

        <div class="nav-right">
            <a href="login.html">Iniciar sesión</a>
        </div>
    `;

    setActiveNavLink();
}


async function updateNav() {
    /**
     * Actualiza el menú de navegación dependiendo de si está logeado o no
     */
    const nav = document.getElementById("nav-auth");
    const token = localStorage.getItem("access_token");
    if (!nav) { return; }
    if (!token) { showGuestNav(nav); return; }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem("access_token");
            showGuestNav(nav);
            return;
        }

        const user = await response.json();

        if (user.is_admin) {
            nav.innerHTML = `
                <div class="nav-center">
                    <a href="index.html">Inicio</a>
                    <a href="films.html">Films</a>
                    <a href="favorites.html">Favoritos</a>
                    <a href="admin.html">Administración</a>
                </div>

                <div class="nav-right"> <a href="profile.html">Mi perfil</a> </div>
            `;
        } 
        else {
            nav.innerHTML = `
                <div class="nav-center">
                    <a href="index.html">Inicio</a>
                    <a href="films.html">Films</a>
                    <a href="favorites.html">Favoritos</a>
                </div>

                <div class="nav-right"> <a href="profile.html">Mi perfil</a> </div>
            `;
        }

        setActiveNavLink();

    } 
    
    catch (error) { console.error(error); }
}


function setActiveNavLink() {
    /**
     * Colorea en el menú de navegación la sección en la que el usuario se encuentra en ese momento
     */
    let currentPage = window.location.pathname.split("/").pop();
    if (!currentPage) { currentPage = "index.html"; }
    if (currentPage === "movie.html") { currentPage = "films.html"; }

    const navLinks = document.querySelectorAll("#nav-auth a");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");

        if (!href || href === "#") { return; }

        link.style.color = "white";
        link.style.fontWeight = "normal";

        if (href === currentPage) {
            link.style.color = "#00c9a7";
            link.style.fontWeight = "bold";
        }
    });
}


function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "index.html";
}


document.addEventListener("DOMContentLoaded", updateNav);