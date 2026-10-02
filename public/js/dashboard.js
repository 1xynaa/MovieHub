document.addEventListener("DOMContentLoaded", async () => {
    const savedContainer = document.getElementById("savedMovies");
    const bookingsContainer = document.getElementById("myBookings");
    if (!savedContainer || !bookingsContainer) return;

    try {
        const user = await MovieHub.fetchJson("/user");
        if (!user.loggedIn) {
            window.location.href = "/login.html";
            return;
        }
        const email = document.querySelector("[data-user-email]");
        if (email) email.textContent = user.email || "Your MovieHub account";
        const [saved, bookings, catalog] = await Promise.all([
            MovieHub.fetchJson("/savedMovies"),
            MovieHub.fetchJson("/myBookings"),
            MovieHub.getMovies()
        ]);
        const savedWithDetails = saved.map((savedMovie) => {
            const movie = catalog.find((item) => item.title.toLowerCase() === savedMovie.movie_name.toLowerCase());
            return {
                ...savedMovie,
                poster: savedMovie.poster || (movie && movie.poster) || "",
                movie_id: savedMovie.movie_id || (movie && movie.id) || ""
            };
        });
        savedContainer.innerHTML = saved.length ? savedWithDetails.map((movie) => `
            <article class="saved-card">
                <img src="${MovieHub.escapeHtml(movie.poster)}" alt="${MovieHub.escapeHtml(movie.movie_name)} poster">
                <div><h3>${MovieHub.escapeHtml(movie.movie_name)}</h3>${movie.movie_id ? `<a href="/movie-details.html?id=${encodeURIComponent(movie.movie_id)}">View movie</a>` : ""}</div>
                <button class="text-button remove-saved" type="button" data-id="${MovieHub.escapeHtml(movie.id)}">Remove</button>
            </article>`).join("") : `<div class="empty-state"><p>Your saved movies will show up here.</p><a href="/movies.html">Explore movies</a></div>`;
        bookingsContainer.innerHTML = bookings.length ? bookings.map((booking) => `
            <article class="booking-card">
                <img src="${MovieHub.escapeHtml(booking.poster)}" alt="${MovieHub.escapeHtml(booking.movie_name)} poster">
                <div class="booking-card-copy"><h3>${MovieHub.escapeHtml(booking.movie_name)}</h3>
                    <p>${MovieHub.escapeHtml(booking.cinema)} · ${MovieHub.escapeHtml(booking.date)} · ${MovieHub.escapeHtml(booking.time)}</p>
                    <p>Seats: ${MovieHub.escapeHtml(booking.seat)}</p>
                </div><span class="booking-confirmed">Confirmed</span>
            </article>`).join("") : `<div class="empty-state"><p>You haven't booked a movie yet.</p><a href="/movies.html">Find your next movie</a></div>`;
    } catch (error) {
        savedContainer.innerHTML = `<p class="error-message">${MovieHub.escapeHtml(error.message)}</p>`;
        bookingsContainer.innerHTML = "";
    }

    savedContainer.addEventListener("click", async (event) => {
        const button = event.target.closest(".remove-saved");
        if (!button) return;
        try {
            await MovieHub.fetchJson(`/deleteMovie/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" });
            button.closest(".saved-card").remove();
            if (!savedContainer.querySelector(".saved-card")) {
                savedContainer.innerHTML = `<div class="empty-state"><p>Your saved movies will show up here.</p><a href="/movies.html">Explore movies</a></div>`;
            }
        } catch (error) {
            MovieHub.showToast(error.message);
        }
    });
});
