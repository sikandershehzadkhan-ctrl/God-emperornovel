import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0031_account_closure_requests.sql",import.meta.url),"utf8");
const upgrade=readFileSync(new URL("../migrations/0040_account_deletion_requests.sql",import.meta.url),"utf8");
const py=String.raw`
import json,sqlite3,sys
payload=json.load(sys.stdin)
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users(id) VALUES(1),(2),(3);")
db.executescript(payload["base"])
fixtures=[
 (101,1,"cancelled",100,200,150,None,"Creator requested a pause","2025-01-02T03:04:05Z","2025-01-03T04:05:06Z"),
 (102,1,"pending_deletion",300,500,None,None,"Awaiting independent creator-rights review","2025-02-02T03:04:05Z","2025-02-03T04:05:06Z"),
 (103,2,"review_required",400,700,None,None,"Finance retention check required","2025-03-02T03:04:05Z","2025-03-03T04:05:06Z"),
]
db.executemany("""INSERT INTO account_closure_requests
 (id,user_id,status,requested_at,grace_until,cancelled_at,completed_at,review_reason,created_at,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?)""",fixtures)
db.executescript(payload["upgrade"])
actual=db.execute("""SELECT id,user_id,status,requested_at,grace_until,cancelled_at,completed_at,review_reason,created_at,updated_at
 FROM account_closure_requests ORDER BY id""").fetchall()
assert actual==fixtures, (actual,fixtures)
try:
 db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'review_required',600,800)")
 raise AssertionError("Only one active closure/deletion request per account must be possible")
except sqlite3.IntegrityError: pass
db.execute("UPDATE account_closure_requests SET status='cancelled',cancelled_at=550 WHERE id=102")
db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'pending_deletion',600,800)")
try:
 db.execute("DELETE FROM users WHERE id=1")
 raise AssertionError("Closure requests must prevent accidental user-row erasure")
except sqlite3.IntegrityError: pass
indexes={row[1] for row in db.execute("PRAGMA index_list(account_closure_requests)")}
assert {"idx_account_closure_one_pending_per_user","idx_account_closure_status_grace"} <= indexes
assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("PASS: migration 0040 preserves IDs, ownership, statuses, lifecycle timestamps, non-empty review reasons, created/updated timestamps, uniqueness, restrictive retention, indexes, and SQLite integrity.")
`;
const r=spawnSync("python3",["-c",py],{input:JSON.stringify({base,upgrade}),encoding:"utf8"});
if(r.status!==0){process.stderr.write(r.stderr||"");process.stdout.write(r.stdout||"");process.exit(r.status||1)}
process.stdout.write(r.stdout);
assert.match(upgrade,/review_reason,created_at,updated_at[\s\S]*SELECT[\s\S]*review_reason,created_at,updated_at/);
assert.match(upgrade,/DROP TABLE account_closure_requests/);
const copyProjection=upgrade.match(/INSERT INTO account_closure_requests_v2[\\s\\S]*?SELECT([\\s\\S]*?)FROM account_closure_requests;/)?.[1];
assert.ok(copyProjection,"upgrade must copy rows from the canonical request table");
assert.match(copyProjection,/review_reason,created_at,updated_at/,"upgrade must copy historical review metadata and timestamps");
assert.doesNotMatch(copyProjection,/CURRENT_TIMESTAMP/,"row-copy projection must not replace historical timestamps; column defaults may still use CURRENT_TIMESTAMP for future inserts");
console.log("PASS: account closure and deletion requests share one canonical table without resetting historical metadata.");
