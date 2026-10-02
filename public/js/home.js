document.addEventListener("DOMContentLoaded", async () => {
    const recommended = document.getElementById("recommendedMovies");
    const showing = document.getElementById("nowShowingMovies");
    const upcoming = document.getElementById("upcomingMovies");
    if (!recommended || !showing) return;

    try {
        const movies = await MovieHub.getMovies();
        const cards = movies.map(MovieHub.createMovieCard).join("");
        recommended.innerHTML = cards;
        showing.innerHTML = cards;
        try {
            const upcomingMovies = await MovieHub.fetchJson("/movies/upcoming");
            upcoming.innerHTML = upcomingMovies.length ? upcomingMovies.slice(0, 4).map((movie) => `
                <a class="upcoming-card" href="/movie-details.html?id=${encodeURIComponent(movie.id)}">
                    <img src="${MovieHub.escapeHtml(movie.poster)}" alt="${MovieHub.escapeHtml(movie.title)} poster" loading="lazy">
                    <div><span class="eyebrow">COMING SOON</span><h3>${MovieHub.escapeHtml(movie.title)}</h3>
                    <p>${MovieHub.escapeHtml(movie.releaseDate || "Release date to be announced")}</p></div>
                </a>`).join("") : `<div class="empty-state">Upcoming release dates are supplied by TMDB when an API key is configured.</div>`;
        } catch (error) {
            upcoming.innerHTML = `<div class="empty-state">${MovieHub.escapeHtml(error.message)}</div>`;
        }
    } catch (error) {
        recommended.textContent = error.message;
        showing.textContent = error.message;
    }
});
