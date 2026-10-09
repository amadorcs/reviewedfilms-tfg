async function registerUser(event) {
    /**
     * Registra un nuevo usuario si los datos introducidos en el formulario son correctos
     */
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "Error al registrarse"); return; }

    alert("Usuario registrado correctamente");
    window.location.href = "login.html";
}


async function loginUser(event) {
    /**
     * Inicia sesión con el usuario que coincide con los datos introducidos en el formulario
     */
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const formData = new URLSearchParams();

    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) { alert(data.detail || "Credenciales incorrectas"); return; }

    localStorage.setItem( "access_token", data.access_token );

    window.location.href = "index.html";
}