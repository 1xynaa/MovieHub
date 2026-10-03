const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./backend/database");
const movieCatalog = require("./backend/movies");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || "moviehub-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
app.use(express.static(__dirname + "/public"));

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Please sign in to continue." });
    }
    next();
}

function getMovieLanguage(languageCode) {
    const languages = {
        en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
        ml: "Malayalam", kn: "Kannada", ko: "Korean", ja: "Japanese"
    };
    return languages[languageCode] || languageCode || "Unknown";
}

function normalizeMovie(movie, credits) {
    return {
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : movie.poster,
        backdrop: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            : movie.backdrop,
        rating: Number(movie.vote_average || movie.rating || 0).toFixed(1),
        genres: movie.genres
            ? movie.genres.map((genre) => genre.name)
            : (movie.genre_names || []),
        language: getMovieLanguage(movie.original_language || movie.language),
        releaseDate: movie.release_date || movie.releaseDate || "",
        overview: movie.overview || "",
        cast: credits && credits.cast
            ? credits.cast.slice(0, 6).map((person) => person.name)
            : (movie.cast || [])
    };
}

async function getMovies() {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return movieCatalog.map((movie) => normalizeMovie(movie));

    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/now_playing?api_key=${encodeURIComponent(apiKey)}&region=IN`
        );
        if (!response.ok) {
            throw new Error(`TMDB returned HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.results.map((movie) => normalizeMovie(movie));
    } catch (error) {
        console.error("Could not load movies from TMDB:", error.message);
        return movieCatalog.map((movie) => normalizeMovie(movie));
    }
}

async function getUpcomingMovies() {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return [];
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/upcoming?api_key=${encodeURIComponent(apiKey)}&region=IN`
        );
        if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}`);
        const data = await response.json();
        return data.results.map((movie) => normalizeMovie(movie));
    } catch (error) {
        console.error("Could not load upcoming movies from TMDB:", error.message);
        throw error;
    }
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({
            message: "Enter your name, a valid email, and a password of at least 6 characters."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name.trim(), email.trim().toLowerCase(), hashedPassword],
            function (error) {
                if (error) {
                    if (error.code === "SQLITE_CONSTRAINT") {
                        return res.status(409).json({ message: "An account with that email already exists." });
                    }
                    console.error("Signup database error:", error.message);
                    return res.status(500).json({ message: "Could not create your account." });
                }
                res.status(201).json({ message: "Account created successfully." });
            }
        );
    } catch (error) {
        console.error("Password hashing failed:", error.message);
        res.status(500).json({ message: "Could not create your account." });
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Enter your email and password." });
    }

    db.get(
        "SELECT id, name, email, password FROM users WHERE email = ?",
        [email.trim().toLowerCase()],
        async (error, user) => {
            if (error) {
                console.error("Login database error:", error.message);
                return res.status(500).json({ message: "Could not sign in right now." });
            }
            if (!user) {
                return res.status(401).json({ message: "Email or password is incorrect." });
            }

            try {
                const passwordMatches = await bcrypt.compare(password, user.password);
                if (!passwordMatches) {
                    return res.status(401).json({ message: "Email or password is incorrect." });
                }
                req.session.regenerate((sessionError) => {
                    if (sessionError) {
                        console.error("Could not start user session:", sessionError.message);
                        return res.status(500).json({ message: "Could not sign in right now." });
                    }
                    req.session.userId = user.id;
                    req.session.userName = user.name;
                    req.session.userEmail = user.email;
                    res.json({ message: "Login successful.", name: user.name });
                });
            } catch (compareError) {
                console.error("Password comparison failed:", compareError.message);
                res.status(500).json({ message: "Could not sign in right now." });
            }
        }
    );
});

app.get("/user", (req, res) => {
    res.json(req.session.userId
        ? { loggedIn: true, name: req.session.userName, email: req.session.userEmail }
        : { loggedIn: false });
});

app.get("/movies", async (req, res) => {
    res.json(await getMovies());
});

app.get("/movies/upcoming", async (req, res) => {
    try {
        res.json(await getUpcomingMovies());
    } catch (error) {
        res.status(502).json({ message: "Upcoming releases could not be loaded from TMDB." });
    }
});

app.get("/movie/:id", async (req, res) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (apiKey) {
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${encodeURIComponent(req.params.id)}?append_to_response=credits&api_key=${encodeURIComponent(apiKey)}`
            );
            if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}`);
            const movie = await response.json();
            return res.json(normalizeMovie(movie, movie.credits));
        } catch (error) {
            console.error("Could not load movie details from TMDB:", error.message);
        }
    }

    const movie = movieCatalog.find((item) => String(item.id) === req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    res.json(normalizeMovie(movie));
});

app.post(["/saveMovie", "/save-movie"], requireLogin, (req, res) => {
    const movieName = (req.body.movie_name || req.body.movieName || "").trim();
    const poster = req.body.poster || "";
    const movieId = req.body.movie_id || req.body.movieId || null;
    if (!movieName) return res.status(400).json({ message: "A movie name is required." });

    db.run(
        `INSERT INTO saved_movies (user_id, movie_name, poster, movie_id)
         SELECT ?, ?, ?, ?
         WHERE NOT EXISTS (
             SELECT 1 FROM saved_movies WHERE user_id = ? AND movie_name = ?
         )`,
        [req.session.userId, movieName, poster, movieId, req.session.userId, movieName],
        function (error) {
            if (error) {
                console.error("Could not save movie:", error.message);
                return res.status(500).json({ message: "Could not save this movie." });
            }
            res.status(201).json({
                message: this.changes ? "Movie saved." : "Movie is already in your saved list.",
                saved: true
            });
        }
    );
});

app.get(["/savedMovies", "/saved-movies"], requireLogin, (req, res) => {
    db.all(
        "SELECT id, movie_name, poster, movie_id FROM saved_movies WHERE user_id = ? ORDER BY id DESC",
        [req.session.userId],
        (error, movies) => {
            if (error) {
                console.error("Could not load saved movies:", error.message);
                return res.status(500).json({ message: "Could not load saved movies." });
            }
            res.json(movies);
        }
    );
});

app.delete(["/deleteMovie", "/deleteMovie/:id", "/delete-movie/:id"], requireLogin, (req, res) => {
    const movieId = req.params.id || req.body.id || req.query.id;
    if (!movieId) return res.status(400).json({ message: "A saved movie ID is required." });
    db.run(
        "DELETE FROM saved_movies WHERE id = ? AND user_id = ?",
        [movieId, req.session.userId],
        function (error) {
            if (error) {
                console.error("Could not delete saved movie:", error.message);
                return res.status(500).json({ message: "Could not remove this movie." });
            }
            if (!this.changes) return res.status(404).json({ message: "Saved movie not found." });
            res.json({ message: "Movie removed." });
        }
    );
});

app.get("/booked-seats", (req, res) => {
    const { cinema, date, time } = req.query;
    if (!cinema || !date || !time) return res.status(400).json({ message: "Select a cinema, date, and time." });
    db.all(
        "SELECT seat FROM bookings WHERE cinema = ? AND date = ? AND time = ? AND movie_id = ?",
        [cinema, date, time, req.query.movie_id || ""],
        (error, rows) => {
            if (error) {
                console.error("Could not load booked seats:", error.message);
                return res.status(500).json({ message: "Could not load seat availability." });
            }
            res.json(rows.flatMap((row) => row.seat.split(",").map((seat) => seat.trim())));
        }
    );
});

app.post("/booking", requireLogin, (req, res) => {
    const { movie_name, movie_id, cinema, date, time, seats, poster } = req.body;
    if (!movie_name || !cinema || !date || !time || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ message: "Choose a movie, cinema, show, and at least one seat." });
    }
    const cleanSeats = [...new Set(seats.map((seat) => String(seat).trim()))];
    const validSeats = cleanSeats.every((seat) => /^[A-C][1-5]$/.test(seat));
    if (!validSeats) return res.status(400).json({ message: "One or more selected seats are invalid." });

    db.all(
        "SELECT seat FROM bookings WHERE cinema = ? AND date = ? AND time = ? AND movie_id = ?",
        [cinema, date, time, movie_id || ""],
        (lookupError, rows) => {
            if (lookupError) {
                console.error("Could not verify seat availability:", lookupError.message);
                return res.status(500).json({ message: "Could not confirm seat availability." });
            }
            const bookedSeats = new Set(rows.flatMap((row) => row.seat.split(",").map((seat) => seat.trim())));
            if (cleanSeats.some((seat) => bookedSeats.has(seat))) {
                return res.status(409).json({ message: "One or more seats were just booked. Please choose again." });
            }

            db.run(
                `INSERT INTO bookings (user_id, movie_name, cinema, date, time, seat, movie_id, poster)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.session.userId, movie_name, cinema, date, time,
                    cleanSeats.join(", "), movie_id || null, poster || ""
                ],
                function (error) {
                    if (error) {
                        console.error("Could not create booking:", error.message);
                        return res.status(500).json({ message: "Could not confirm your booking." });
                    }
                    res.status(201).json({ message: "Booking confirmed.", bookingId: this.lastID });
                }
            );
        }
    );
});

app.get("/myBookings", requireLogin, (req, res) => {
    db.all(
        "SELECT id, movie_name, cinema, date, time, seat, movie_id, poster FROM bookings WHERE user_id = ? ORDER BY id DESC",
        [req.session.userId],
        (error, bookings) => {
            if (error) {
                console.error("Could not load bookings:", error.message);
                return res.status(500).json({ message: "Could not load your bookings." });
            }
            res.json(bookings);
        }
    );
});

app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Could not end session:", error.message);
            return res.status(500).json({ message: "Logout failed." });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out." });
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`MovieHub running on port ${PORT}`);
});