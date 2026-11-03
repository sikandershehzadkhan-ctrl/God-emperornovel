import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const worker = fs.readFileSync("src/index.js", "utf8");
const registerStart = worker.indexOf('if(p==="/api/auth/register"&&m==="POST")');
const loginStart = worker.indexOf('if(p==="/api/auth/login"&&m==="POST")');
assert.ok(registerStart >= 0 && loginStart > registerStart, "Registration route must be registered before login.");
const registerRoute = worker.slice(registerStart, loginStart);
assert.ok(registerRoute.includes('FROM username_history WHERE old_username=? COLLATE NOCASE'), "Registration must pre-check historical usernames.");
assert.ok(registerRoute.includes("That username is reserved because it was previously used by another account."), "Registration must return a clear reserved-name response.");

const migration = fs.readFileSync("migrations/0015_username_historical_insert_guard.sql", "utf8");
assert.match(migration, /BEFORE INSERT ON users/);
assert.match(migration, /old_username=NEW\.username COLLATE NOCASE/);
assert.match(migration, /RAISE\(ABORT, 'username is reserved'\)/);

const db = new DatabaseSync(":memory:");
db.exec(`
  PRAGMA foreign_keys=ON;
  CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE);
  CREATE TABLE username_history(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), old_username TEXT NOT NULL);
  INSERT INTO users(id, username) VALUES (1, 'new_name');
  INSERT INTO username_history(user_id, old_username) VALUES (1, 'old_name');
`);
db.exec(migration);
assert.throws(
  () => db.prepare("INSERT INTO users(username) VALUES (?)").run("OLD_NAME"),
  /username is reserved/
);
db.prepare("INSERT INTO users(username) VALUES (?)").run("fresh_name");
db.close();

console.log("Historical username registration pre-check and SQLite INSERT trigger passed.");
