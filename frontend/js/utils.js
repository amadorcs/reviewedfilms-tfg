export function formatReviewDate(dateString) {
    /**
     * Retorna la fecha en formato español.
     */
    const date = new Date(dateString);

    return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

export function getAuthToken(){
    const token = localStorage.getItem("access_token");
    if (!token) { 
        window.location.href = "login.html"; 
        return null; 
    }

    return token
}
