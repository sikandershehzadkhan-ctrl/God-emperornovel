import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migration=readFileSync(new URL("../migrations/0014_account_deletion_requests.sql",import.meta.url),"utf8");
const py=String.raw`
import sqlite3,sys
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY);")
db.executescript(sys.stdin.read())
db.execute("INSERT INTO users(id) VALUES(1)")
db.execute("INSERT INTO users(id) VALUES(2)")
db.execute("INSERT INTO account_deletion_requests(user_id,status,requested_at,scheduled_for) VALUES(1,'pending_deletion','2026-01-01T00:00:00Z','2026-01-31T00:00:00Z')")
try:
 db.execute("INSERT INTO account_deletion_requests(user_id,status,requested_at,scheduled_for) VALUES(1,'review_required','2026-01-02T00:00:00Z','2026-02-01T00:00:00Z')")
 raise AssertionError("Only one active request per account must be possible")
except sqlite3.IntegrityError: pass
db.execute("UPDATE account_deletion_requests SET status='cancelled',cancelled_at='2026-01-03T00:00:00Z' WHERE user_id=1")
db.execute("INSERT INTO account_deletion_requests(user_id,status,requested_at,scheduled_for) VALUES(1,'pending_deletion','2026-02-01T00:00:00Z','2026-03-03T00:00:00Z')")
try:
 db.execute("DELETE FROM users WHERE id=1")
 raise AssertionError("Deletion requests must prevent accidental user-row erasure")
except sqlite3.IntegrityError: pass
assert db.execute("SELECT COUNT(*) FROM account_deletion_requests WHERE user_id=1").fetchone()[0]==2
print("PASS: deletion lifecycle schema enforces one active request, cancellation/re-request, and restrictive user retention.")
`;
const r=spawnSync("python3",["-c",py],{input:migration,encoding:"utf8"});
if(r.status!==0){process.stderr.write(r.stderr||"");process.exit(r.status||1)}
process.stdout.write(r.stdout);
assert.match(migration,/ON DELETE RESTRICT/);
assert.match(migration,/WHERE status IN \('pending_deletion','review_required'\)/);
console.log("PASS: account deletion migration policy.");
