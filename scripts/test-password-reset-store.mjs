import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { completePasswordReset, PASSWORD_RESET_COMPLETION_SQL } from "../src/password-reset-store.mjs";

const migration = readFileSync(new URL("../migrations/0009_password_reset_tokens.sql", import.meta.url), "utf8");
assert.equal(PASSWORD_RESET_COMPLETION_SQL.length, 4);
const valid = { tokenHash: "A".repeat(43), passwordHash: "pbkdf2-sha256$120000$" + "B".repeat(22) + "$" + "C".repeat(43), now: "2026-11-02T12:00:00.000Z" };
let prepared = [];
const fakeDb = { prepare(sql) { return { sql, bind(...values) { prepared.push({ sql, values }); return this; } }; }, async batch(statements) { assert.equal(statements.length, 4); return [{ results: [{ user_id: 41 }] }, {}, {}, {}]; } };
assert.deepEqual(await completePasswordReset(fakeDb, valid), { ok: true, userId: 41 });
assert.equal(prepared.length, 4);
assert.match(prepared[0].sql, /consumed_at IS NULL/);
for (const item of prepared) assert.match(item.sql, /consumption_id=\?/);
assert.match(prepared[0].values[1], /^[0-9a-f-]{36}$/i);
assert.match(prepared[0].sql, /expires_at>\?/);
assert.deepEqual(await completePasswordReset({ ...fakeDb, async batch() { return [{ results: [] }, {}, {}, {}]; } }, valid), { ok: false });
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, tokenHash: "bad" }), /Invalid password-reset token digest/);
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, passwordHash: "plaintext" }), /Invalid password hash/);
await assert.rejects(() => completePasswordReset(fakeDb, { ...valid, now: "not-a-date" }), /normalized UTC timestamp/);

const python = String.raw`
import json, sqlite3, sys
p=json.loads(sys.stdin.read()); db=sqlite3.connect(":memory:"); db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY,password_hash TEXT NOT NULL); CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE);")
db.executescript(p["migration"]); now="2026-11-02T12:00:00.000Z";
db.executemany("INSERT INTO users VALUES(?,?)", [(1,"old-a"),(2,"old-b")])
db.executemany("INSERT INTO sessions VALUES(?,?)", [("a1",1),("a2",1),("b1",2)])
db.executemany("INSERT INTO password_reset_tokens(user_id,token_hash,purpose,expires_at) VALUES(?,?,?,?)", [(1,"A"*43,"password_reset","2026-11-02T12:20:00.000Z"),(1,"D"*43,"password_reset","2026-11-02T12:20:00.000Z"),(2,"B"*43,"password_reset","2026-11-02T12:20:00.000Z"),(2,"E"*43,"password_reset","2026-11-02T11:59:00.000Z")]); db.commit()
s=p["sql"]
def complete(token,pw,op):
 db.execute("BEGIN IMMEDIATE")
 try:
  row=db.execute(s[0],(now,op,token,now)).fetchone()
  db.execute(s[1],(pw,token,op)); db.execute(s[2],(token,op)); db.execute(s[3],(now,token,op,token)); db.commit()
  return row[0] if row else None
 except: db.rollback(); raise
assert complete("A"*43,"new-a","op-unique-1")==1
assert db.execute("SELECT password_hash FROM users WHERE id=1").fetchone()[0]=="new-a"
assert db.execute("SELECT password_hash FROM users WHERE id=2").fetchone()[0]=="old-b"
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id=1").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id=2").fetchone()[0]==1
assert db.execute("SELECT consumption_id FROM password_reset_tokens WHERE token_hash=?",("A"*43,)).fetchone()[0]=="op-unique-1"
# Replay with the exact same timestamp but a different operation ID must not update the password.
assert complete("A"*43,"replay","op-unique-2") is None
assert db.execute("SELECT password_hash FROM users WHERE id=1").fetchone()[0]=="new-a"
assert complete("E"*43,"expired","op-expired") is None
try: db.execute("INSERT INTO password_reset_tokens(user_id,token_hash,purpose,expires_at) VALUES(2,?,?,?)",("F"*43,"other_purpose","2026-11-02T12:20:00.000Z")); raise AssertionError("purpose accepted")
except sqlite3.IntegrityError: db.rollback()
assert complete("F"*43,"wrong-purpose","op-purpose") is None
db.execute("BEGIN IMMEDIATE"); db.execute(s[0],(now,"op-failure","B"*43,now))
try: db.execute("INSERT INTO missing_table VALUES(1)"); raise AssertionError("failure injection did not fail")
except sqlite3.OperationalError: db.rollback()
assert db.execute("SELECT consumed_at,consumption_id FROM password_reset_tokens WHERE token_hash=?",("B"*43,)).fetchone()==(None,None)
print("PASS: atomic reset isolation, one-time consumption, timestamp-collision replay protection, expiry, purpose constraint and rollback.")
`;
const result = spawnSync("python3", ["-c", python], { input: JSON.stringify({ migration, sql: PASSWORD_RESET_COMPLETION_SQL }), encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) { process.stderr.write(result.stderr || ""); process.stdout.write(result.stdout || ""); process.exit(result.status || 1); }
process.stdout.write(result.stdout);
console.log("PASS: password reset D1 batch binding contract.");
