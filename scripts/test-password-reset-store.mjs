import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  completePasswordReset,
  PASSWORD_RESET_COMPLETION_SQL
} from "../src/password-reset-store.mjs";

const migration = readFileSync(new URL("../migrations/0009_password_reset_tokens.sql", import.meta.url), "utf8");
assert.equal(PASSWORD_RESET_COMPLETION_SQL.length, 4);

const valid = {
  tokenHash: "A".repeat(43),
  passwordHash: "pbkdf2-sha256$120000$" + "B".repeat(22) + "$" + "C".repeat(43),
  now: "2026-11-02T12:00:00.000Z"
};
let prepared = [];
const fakeDb = {
  prepare(sql) {
    return { sql, bind(...values) { prepared.push({ sql, values }); return this; } };
  },
  async batch(statements) {
    assert.equal(statements.length, 4);
    return [{ results: [{ user_id: 41 }] }, {}, {}, {}];
  }
};
assert.deepEqual(await completePasswordReset(fakeDb, valid), { ok: true, userId: 41 });
assert.equal(prepared.length, 4);
assert.match(prepared[0].sql, /consumed_at IS NULL/);
assert.match(prepared[0].sql, /expires_at>\?/);
assert.match(prepared[1].sql, /WHERE id=\(SELECT user_id/);
assert.match(prepared[2].sql, /WHERE user_id=\(SELECT user_id/);
assert.match(prepared[3].sql, /token_hash<>\?/);
assert.deepEqual(await completePasswordReset({
  ...fakeDb,
  async batch() { return [{ results: [] }, {}, {}, {}]; }
}, valid), { ok: false });
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, tokenHash: "bad" }), /Invalid password-reset token digest/);
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, passwordHash: "plaintext" }), /Invalid password hash/);
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, now: "not-a-date" }), /normalized UTC timestamp/);

const python = String.raw`
import json, sqlite3, sys
payload = json.loads(sys.stdin.read())
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, password_hash TEXT NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE);
""")
db.executescript(payload["migration"])
now = "2026-11-02T12:00:00.000Z"
later = "2026-11-02T12:20:00.000Z"
db.executemany("INSERT INTO users(id,password_hash) VALUES(?,?)", [(1,"old-a"),(2,"old-b")])
db.executemany("INSERT INTO sessions(token_hash,user_id) VALUES(?,?)", [("a-session-1",1),("a-session-2",1),("b-session-1",2)])
db.executemany("""INSERT INTO password_reset_tokens(user_id,token_hash,purpose,expires_at)
                  VALUES(?,?,?,?)""", [
  (1,"A"*43,"password_reset","2026-11-02T12:20:00.000Z"),
  (1,"D"*43,"password_reset","2026-11-02T12:20:00.000Z"),
  (2,"B"*43,"password_reset","2026-11-02T12:20:00.000Z"),
  (2,"E"*43,"password_reset","2026-11-02T11:59:00.000Z")
])
sql = payload["sql"]
def complete(token, password, timestamp):
    db.execute("BEGIN IMMEDIATE")
    try:
        consumed = db.execute(sql[0], (timestamp, token, timestamp)).fetchone()
        db.execute(sql[1], (password, token, timestamp))
        db.execute(sql[2], (token, timestamp))
        db.execute(sql[3], (timestamp, token, timestamp, token))
        db.commit()
        return consumed[0] if consumed else None
    except:
        db.rollback()
        raise
assert complete("A"*43, "new-a", now) == 1
assert db.execute("SELECT password_hash FROM users WHERE id=1").fetchone()[0] == "new-a"
assert db.execute("SELECT password_hash FROM users WHERE id=2").fetchone()[0] == "old-b"
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id=1").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id=2").fetchone()[0] == 1
states = dict(db.execute("SELECT token_hash, CASE WHEN consumed_at IS NOT NULL THEN 'consumed' WHEN invalidated_at IS NOT NULL THEN 'invalidated' ELSE 'active' END FROM password_reset_tokens"))
assert states["A"*43] == "consumed"
assert states["D"*43] == "invalidated"
assert complete("A"*43, "replay", now) is None
assert complete("E"*43, "expired", now) is None
try:\n    db.execute("INSERT INTO password_reset_tokens(user_id,token_hash,purpose,expires_at) VALUES(2,?,?,?)", ("F"*43,"other_purpose","2026-11-02T12:20:00.000Z"))\n    raise AssertionError("wrong-purpose token was accepted by schema")\nexcept sqlite3.IntegrityError:\n    pass\nassert complete("F"*43, "wrong-purpose", now) is None
assert db.execute("SELECT password_hash FROM users WHERE id=2").fetchone()[0] == "old-b"
# Simulate a D1 batch failure after token consumption: the enclosing transaction rolls back.
db.execute("BEGIN IMMEDIATE")
db.execute(sql[0], (now, "B"*43, now))
try:
    db.execute("INSERT INTO table_that_does_not_exist VALUES(1)")
    raise AssertionError("failure injection did not fail")
except sqlite3.OperationalError:
    db.rollback()
assert db.execute("SELECT consumed_at FROM password_reset_tokens WHERE token_hash=?", ("B"*43,)).fetchone()[0] is None
print("PASS: atomic reset updates only the bound account, consumes once, revokes only its sessions, invalidates sibling tokens, rejects expired tokens and enforces purpose at schema level, and rolls back on batch failure.")
`;
const result = spawnSync("python3", ["-c", python], {
  input: JSON.stringify({ migration, sql: PASSWORD_RESET_COMPLETION_SQL }),
  encoding: "utf8"
});
if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || "");
  process.stdout.write(result.stdout || "");
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
console.log("PASS: password reset D1 batch guard and binding contract.");
