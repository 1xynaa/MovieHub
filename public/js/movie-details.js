document.addEventListener("DOMContentLoaded", async () => {
    const content = document.getElementById("movieDetails");
    if (!content) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
        content.innerHTML = `<div class="empty-state"><h1>Choose a movie first</h1><a class="button button-primary" href="/movies.html">Browse movies</a></div>`;
        return;
    }

    try {
        const movie = await MovieHub.getMovie(id);
        document.title = `${movie.title} | MovieHub`;
        content.innerHTML = `
            <section class="detail-hero" style="--detail-backdrop: url('${MovieHub.escapeHtml(movie.backdrop)}')">
                <div class="detail-poster"><img src="${MovieHub.escapeHtml(movie.poster)}" alt="${MovieHub.escapeHtml(movie.title)} poster"></div>
                <div class="detail-copy">
                    <p class="eyebrow">MOVIE DETAILS</p>
                    <h1>${MovieHub.escapeHtml(movie.title)}</h1>
                    <p class="detail-meta">★ ${MovieHub.escapeHtml(movie.rating)} <span>·</span> ${MovieHub.escapeHtml(movie.genres.join(", "))} <span>·</span> ${MovieHub.escapeHtml(movie.language)}</p>
                    <p class="detail-date">Release date: ${MovieHub.escapeHtml(movie.releaseDate || "Not announced")}</p>
                    <p class="detail-overview">${MovieHub.escapeHtml(movie.overview)}</p>
                    <a class="button button-primary" href="/booking.html?id=${encodeURIComponent(movie.id)}">Book tickets</a>
                </div>
            </section>
            <section class="content-section detail-cast">
                <p class="eyebrow">ON SCREEN</p><h2>Cast</h2>
                <div class="cast-list">${(movie.cast || []).map((name) => `<span class="cast-pill">${MovieHub.escapeHtml(name)}</span>`).join("") || "<p>Cast information is not available.</p>"}</div>
            </section>`;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><h1>We couldn't load this movie</h1><p>${MovieHub.escapeHtml(error.message)}</p><a class="button button-primary" href="/movies.html">Browse movies</a></div>`;
    }
});
