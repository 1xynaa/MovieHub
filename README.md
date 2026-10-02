# MovieHub

A beginner-friendly movie discovery and booking demo built with HTML, CSS, vanilla JavaScript, Express, SQLite, and bcrypt.

## Run locally

1. Install the dependencies with `npm install`.
2. Start the app with `npm start`.
3. Open `http://localhost:3000`.

The existing `database.db` is reused. Startup creates the `bookings` table and adds poster/movie ID columns to the existing saved-movie table without changing user accounts or password hashes.

## TMDB movie data

MovieHub requests now-playing movies, upcoming releases, and movie details from TMDB on the server. Set a TMDB v3 API key before starting the server to enable live data:

```powershell
$env:TMDB_API_KEY = "your-tmdb-api-key"
npm start
```

Without a key, the app uses a small curated set of TMDB movie records for discovery and details. Upcoming movies are left empty rather than inventing release dates. Event listings are sample data maintained in `public/js/events.js`.

## Main routes

- `POST /signup` and `POST /login` create accounts and start sessions.
- `GET /movies`, `GET /movies/upcoming`, and `GET /movie/:id` provide movie information.
- `POST /saveMovie`, `GET /savedMovies`, and `DELETE /deleteMovie/:id` manage a user's saved movies.
- `POST /booking`, `GET /booked-seats`, and `GET /myBookings` manage simple seat reservations.
- `GET /user` reports the current session; `GET /logout` ends it.

Set `SESSION_SECRET` to a long, private value for a deployed instance. The default is only intended for local development.
