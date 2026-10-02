(function () {
    let movieRequest;

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Something went wrong. Please try again.");
        }
        return data;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    }

    function movieUrl(movie, page) {
        return `/${page}.html?id=${encodeURIComponent(movie.id)}`;
    }

    function createMovieCard(movie) {
        const genres = (movie.genres || []).slice(0, 2).join(" · ") || "Feature film";
        return `
            <article class="movie-card">
                <a class="movie-poster-link" href="${movieUrl(movie, "movie-details")}" aria-label="View ${escapeHtml(movie.title)} details">
                    <img class="movie-poster" src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)} poster" loading="lazy">
                    <span class="poster-rating">★ ${escapeHtml(movie.rating)}</span>
                </a>
                <div class="movie-card-info">
                    <h3><a href="${movieUrl(movie, "movie-details")}">${escapeHtml(movie.title)}</a></h3>
                    <p>${escapeHtml(genres)} <span class="movie-language">· ${escapeHtml(movie.language)}</span></p>
                    <div class="movie-card-actions">
                        <a class="button button-primary button-small" href="${movieUrl(movie, "booking")}">Book tickets</a>
                        <button class="icon-button save-movie" type="button" data-movie-id="${escapeHtml(movie.id)}" aria-label="Save ${escapeHtml(movie.title)}" title="Save movie">♡</button>
                    </div>
                    <a class="movie-details-link" href="${movieUrl(movie, "movie-details")}">View details</a>
                </div>
            </article>`;
    }

    function showToast(message) {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "toast";
            toast.setAttribute("role", "status");
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("toast-visible");
        window.clearTimeout(toast.hideTimer);
        toast.hideTimer = window.setTimeout(() => toast.classList.remove("toast-visible"), 2800);
    }

    async function getMovies() {
        if (!movieRequest) {
            movieRequest = fetchJson("/movies").catch((error) => {
                movieRequest = null;
                throw error;
            });
        }
        return movieRequest;
    }

    async function getMovie(id) {
        return fetchJson(`/movie/${encodeURIComponent(id)}`);
    }

    async function saveMovie(movie) {
        const result = await fetchJson("/saveMovie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                movie_id: movie.id,
                movie_name: movie.title,
                poster: movie.poster
            })
        });
        return result;
    }

    document.addEventListener("click", async (event) => {
        const button = event.target.closest ? event.target.closest(".save-movie") : null;
        if (!button) return;
        try {
            const movie = (await getMovies()).find((item) => String(item.id) === button.dataset.movieId);
            if (!movie) {
                showToast("That movie could not be found.");
                return;
            }
            const result = await saveMovie(movie);
            showToast(result.message);
            button.textContent = "♥";
            button.classList.add("is-saved");
        } catch (error) {
            if (error.message.toLowerCase().includes("sign in")) {
                window.location.href = "/login.html";
                return;
            }
            showToast(error.message);
        }
    });

    window.MovieHub = {
        fetchJson,
        escapeHtml,
        createMovieCard,
        getMovies,
        getMovie,
        showToast
    };
})();
