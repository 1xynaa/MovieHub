document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("movieGrid");
    if (!grid) return;

    const status = document.getElementById("movieStatus");
    const search = document.getElementById("movieSearch");
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";
    const selectedGenre = params.get("genre") || "";
    const selectedLanguage = params.get("language") || "";
    if (search) search.value = initialQuery;

    try {
        const allMovies = await MovieHub.getMovies();
        const render = () => {
            const query = (search ? search.value : "").trim().toLowerCase();
            const filtered = allMovies.filter((movie) => {
                const matchesQuery = !query || `${movie.title} ${movie.genres.join(" ")} ${movie.language}`.toLowerCase().includes(query);
                const genreQuery = selectedGenre.toLowerCase() === "sci-fi" ? "science fiction" : selectedGenre.toLowerCase();
                const matchesGenre = !selectedGenre || movie.genres.some((genre) => genre.toLowerCase().includes(genreQuery));
                const matchesLanguage = !selectedLanguage || movie.language.toLowerCase() === selectedLanguage.toLowerCase();
                return matchesQuery && matchesGenre && matchesLanguage;
            });
            grid.innerHTML = filtered.map(MovieHub.createMovieCard).join("");
            status.textContent = filtered.length ? `${filtered.length} movies to discover` : "No movies match those filters.";
        };
        if (search) search.addEventListener("input", render);
        render();
    } catch (error) {
        status.textContent = error.message;
    }
});
