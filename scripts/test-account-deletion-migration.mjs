import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0031_account_closure_requests.sql",import.meta.url),"utf8");
const upgrade=readFileSync(new URL("../migrations/0040_account_deletion_requests.sql",import.meta.url),"utf8");
const migration=base+"\n"+upgrade;
const py=String.raw`
import sqlite3,sys
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users(id) VALUES(1),(2);")
db.executescript(sys.stdin.read())
db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'pending',100,200)")
for status in ('review_required','pending_deletion'):
 try:
  db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,?,101,201)",(status,))
  raise AssertionError("Only one active closure/deletion request per account must be possible")
 except sqlite3.IntegrityError: pass
db.execute("UPDATE account_closure_requests SET status='cancelled',cancelled_at=150 WHERE user_id=1")
db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'pending_deletion',200,300)")
try:
 db.execute("DELETE FROM users WHERE id=1")
 raise AssertionError("Closure requests must prevent accidental user-row erasure")
except sqlite3.IntegrityError: pass
assert db.execute("SELECT COUNT(*) FROM account_closure_requests WHERE user_id=1").fetchone()[0]==2
columns={row[1] for row in db.execute("PRAGMA table_info(account_closure_requests)")}
assert {'review_reason','created_at','updated_at','grace_until'} <= columns
print("PASS: one canonical closure/deletion request ledger enforces active-request uniqueness, cancellation/re-request, review metadata and restrictive user retention.")
`;
const r=spawnSync("python3",["-c",py],{input:migration,encoding:"utf8"});
if(r.status!==0){process.stderr.write(r.stderr||"");process.stdout.write(r.stdout||"");process.exit(r.status||1)}
process.stdout.write(r.stdout);
assert.match(upgrade,/DROP TABLE account_closure_requests/);
assert.doesNotMatch(migration,/CREATE TABLE IF NOT EXISTS account_deletion_requests/);
console.log("PASS: account closure and deletion request migrations share one canonical table.");
