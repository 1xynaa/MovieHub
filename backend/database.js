const path = require("path");
const { DatabaseSync } = require("node:sqlite");


// Use /tmp on Vercel because the deployed app cannot use
// the project folder as a normal writable database location.
const databasePath =
    process.env.DATABASE_PATH ||
    (process.env.VERCEL
        ? "/tmp/moviehub.db"
        : path.join(__dirname, "..", "database.db"));


const sqlite = new DatabaseSync(databasePath);


// Small wrapper so the rest of the project can keep using
// the same db.run(), db.get() and db.all() style.
const db = {};


// =========================
// RUN
// =========================

db.run = function(sql, params, callback) {

    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    params = params || [];

    try {

        const statement =
            sqlite.prepare(sql);

        const result =
            statement.run(...params);

        statement.close();


        if (callback) {

            callback.call(
                {
                    changes: Number(result.changes || 0),
                    lastID: Number(result.lastInsertRowid || 0)
                },
                null
            );

        }

    } catch (error) {

        if (callback) {
            callback.call({}, error);
        }

    }

};


// =========================
// GET
// =========================

db.get = function(sql, params, callback) {

    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    params = params || [];


    try {

        const statement =
            sqlite.prepare(sql);

        const row =
            statement.get(...params);

        statement.close();


        callback(null, row);

    } catch (error) {

        callback(error);

    }

};


// =========================
// ALL
// =========================

db.all = function(sql, params, callback) {

    if (typeof params === "function") {
        callback = params;
        params = [];
    }

    params = params || [];


    try {

        const statement =
            sqlite.prepare(sql);

        const rows =
            statement.all(...params);

        statement.close();


        callback(null, rows);

    } catch (error) {

        callback(error);

    }

};


// =========================
// DATABASE SETUP
// =========================

function setupDatabase() {

    sqlite.exec(`

        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        );

    `);


    sqlite.exec(`

        CREATE TABLE IF NOT EXISTS saved_movies (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            movie_name TEXT NOT NULL,

            poster TEXT NOT NULL DEFAULT '',

            movie_id TEXT

        );

    `);


    sqlite.exec(`

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

        );

    `);

}


setupDatabase();


module.exports = db;