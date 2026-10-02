const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "..", "database.db");
const db = new sqlite3.Database(databasePath);

function run(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, (error) => error ? reject(error) : resolve());
    });
}

function getColumnNames(table) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, (error, columns) => {
            if (error) return reject(error);
            resolve(columns.map((column) => column.name));
        });
    });
}

async function initializeDatabase() {
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);
    await run(`
        CREATE TABLE IF NOT EXISTS saved_movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            movie_name TEXT NOT NULL,
            poster TEXT NOT NULL DEFAULT '',
            movie_id TEXT
        )
    `);
    await run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            movie_name TEXT NOT NULL,
            cinema TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            seat TEXT NOT NULL,
            movie_id TEXT,
            poster TEXT NOT NULL DEFAULT ''
        )
    `);

    const savedMovieColumns = await getColumnNames("saved_movies");
    if (!savedMovieColumns.includes("poster")) {
        await run("ALTER TABLE saved_movies ADD COLUMN poster TEXT NOT NULL DEFAULT ''");
    }
    if (!savedMovieColumns.includes("movie_id")) {
        await run("ALTER TABLE saved_movies ADD COLUMN movie_id TEXT");
    }

    const bookingColumns = await getColumnNames("bookings");
    if (!bookingColumns.includes("movie_id")) {
        await run("ALTER TABLE bookings ADD COLUMN movie_id TEXT");
    }
    if (!bookingColumns.includes("poster")) {
        await run("ALTER TABLE bookings ADD COLUMN poster TEXT NOT NULL DEFAULT ''");
    }
}

db.ready = initializeDatabase();

module.exports = db;
