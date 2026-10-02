document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("id");
    const movieName = document.getElementById("bookingMovieName");
    const poster = document.getElementById("bookingPoster");
    const cinema = document.getElementById("cinema");
    const date = document.getElementById("showDate");
    const timeButtons = document.querySelectorAll("[data-show-time]");
    const seatGrid = document.getElementById("seatGrid");
    const amount = document.getElementById("bookingAmount");
    const seatCount = document.getElementById("seatCount");
    const form = document.getElementById("bookingForm");
    let movie;
    let selectedTime = "";
    const ticketPrice = 250;

    if (!movieId) {
        MovieHub.showToast("Choose a movie to start booking.");
        window.location.href = "/movies.html";
        return;
    }

    try {
        movie = await MovieHub.getMovie(movieId);
        movieName.textContent = movie.title;
        poster.src = movie.poster;
        poster.alt = `${movie.title} poster`;
        document.title = `Book ${movie.title} | MovieHub`;
    } catch (error) {
        MovieHub.showToast(error.message);
        return;
    }

    const today = new Date();
    date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    date.value = date.min;

    ["A", "B", "C"].forEach((row) => {
        const rowElement = document.createElement("div");
        rowElement.className = "seat-row";
        rowElement.innerHTML = `<span class="row-label">${row}</span>`;
        for (let number = 1; number <= 5; number += 1) {
            const seat = document.createElement("button");
            seat.type = "button";
            seat.className = "seat";
            seat.textContent = `${row}${number}`;
            seat.dataset.seat = `${row}${number}`;
            seat.setAttribute("aria-label", `Seat ${row}${number}`);
            seat.addEventListener("click", () => {
                if (seat.classList.contains("booked")) return;
                seat.classList.toggle("selected");
                updateTotal();
            });
            rowElement.appendChild(seat);
        }
        seatGrid.appendChild(rowElement);
    });

    function updateTotal() {
        const count = seatGrid.querySelectorAll(".seat.selected").length;
        seatCount.textContent = `${count} seat${count === 1 ? "" : "s"} selected`;
        const total = `₹${(count * ticketPrice).toLocaleString("en-IN")}`;
        amount.textContent = total;
        document.getElementById("bookingSubtotal").textContent = total;
    }

    async function refreshSeats() {
        seatGrid.querySelectorAll(".seat").forEach((seat) => {
            seat.classList.remove("booked", "selected");
            seat.disabled = false;
        });
        updateTotal();
        if (!cinema.value || !date.value || !selectedTime) return;
        try {
            const booked = await MovieHub.fetchJson(
                `/booked-seats?cinema=${encodeURIComponent(cinema.value)}&date=${encodeURIComponent(date.value)}&time=${encodeURIComponent(selectedTime)}&movie_id=${encodeURIComponent(movie.id)}`
            );
            booked.forEach((seatName) => {
                const seat = seatGrid.querySelector(`[data-seat="${seatName}"]`);
                if (seat) {
                    seat.classList.add("booked");
                    seat.disabled = true;
                }
            });
        } catch (error) {
            MovieHub.showToast(error.message);
        }
    }

    timeButtons.forEach((button) => button.addEventListener("click", () => {
        timeButtons.forEach((timeButton) => timeButton.classList.remove("selected"));
        button.classList.add("selected");
        selectedTime = button.dataset.showTime;
        refreshSeats();
    }));
    cinema.addEventListener("change", refreshSeats);
    date.addEventListener("change", refreshSeats);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const selectedSeats = [...seatGrid.querySelectorAll(".seat.selected")].map((seat) => seat.dataset.seat);
        if (!cinema.value || !date.value || !selectedTime || selectedSeats.length === 0) {
            MovieHub.showToast("Choose a cinema, date, show time, and at least one seat.");
            return;
        }
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        try {
            await MovieHub.fetchJson("/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movie_id: movie.id,
                    movie_name: movie.title,
                    poster: movie.poster,
                    cinema: cinema.value,
                    date: date.value,
                    time: selectedTime,
                    seats: selectedSeats
                })
            });
            MovieHub.showToast("Booking confirmed. See you at the movies!");
            window.setTimeout(() => window.location.href = "/dashboard.html", 900);
        } catch (error) {
            MovieHub.showToast(error.message);
            await refreshSeats();
        } finally {
            button.disabled = false;
        }
    });
});
