import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql", import.meta.url), "utf8");
const python = String.raw`
import sqlite3, sys
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE account_deletion_requests(
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, status TEXT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);
INSERT INTO users(id) VALUES (1),(2),(3),(4);
INSERT INTO account_deletion_requests(id,user_id,status) VALUES (10,1,'review_required'),(11,2,'cancelled');
""")
db.executescript(sys.stdin.read())
# Valid case and event.
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id) VALUES(100,10,1)")
db.execute("INSERT INTO account_deletion_review_events(review_id,request_id,actor_id,event_type,review_version) VALUES(100,10,2,'case_opened',1)")
# Request/subject binding and inactive requests are enforced.
for sql in [
 "INSERT INTO account_deletion_reviews(request_id,subject_user_id) VALUES(10,2)",
 "INSERT INTO account_deletion_reviews(request_id,subject_user_id) VALUES(11,2)"
]:
 try: db.execute(sql); raise AssertionError("invalid review binding accepted")
 except sqlite3.IntegrityError: pass
# Requester cannot claim or author a review event.
try:
 db.execute("UPDATE account_deletion_reviews SET claimed_by=1,claim_expires_at='2026-12-01T00:00:00Z',version=2 WHERE id=100")
 raise AssertionError("requester claim accepted")
except sqlite3.IntegrityError: pass
try:
 db.execute("INSERT INTO account_deletion_review_events(review_id,request_id,actor_id,event_type,review_version) VALUES(100,10,1,'state_changed',1)")
 raise AssertionError("requester-authored event accepted")
except sqlite3.IntegrityError: pass
# Optimistic concurrency requires exactly one version increment.
try:
 db.execute("UPDATE account_deletion_reviews SET state='review_in_progress' WHERE id=100")
 raise AssertionError("missing version increment accepted")
except sqlite3.IntegrityError: pass
db.execute("UPDATE account_deletion_reviews SET state='review_in_progress',version=2,claimed_by=2,claim_expires_at='2026-12-01T00:00:00Z' WHERE id=100 AND version=1")
assert db.execute("SELECT version,state FROM account_deletion_reviews WHERE id=100").fetchone()==(2,'review_in_progress')
# Events must refer to current version and exact request.
for args in [(100,10,2,'state_changed',1),(100,11,2,'state_changed',2)]:
 try:
  db.execute("INSERT INTO account_deletion_review_events(review_id,request_id,actor_id,event_type,review_version) VALUES(?,?,?,?,?)",args)
  raise AssertionError("stale or cross-request event accepted")
 except sqlite3.IntegrityError: pass
db.execute("INSERT INTO account_deletion_review_events(review_id,request_id,actor_id,event_type,review_version) VALUES(100,10,3,'state_changed',2)")
# Audit history cannot be rewritten or erased.
for sql in ["UPDATE account_deletion_review_events SET metadata_json='{}' WHERE id=1","DELETE FROM account_deletion_review_events WHERE id=1"]:
 try: db.execute(sql); raise AssertionError("append-only audit mutation accepted")
 except sqlite3.IntegrityError: pass
# A proposer cannot approve own plan; requester cannot approve; valid independent approval can.
digest='a'*64
for proposer,approver in [(2,2),(2,1)]:
 try:
  db.execute("UPDATE account_deletion_reviews SET proposed_by=?,plan_digest=?,approved_by=?,version=3 WHERE id=100",(proposer,digest,approver))
  raise AssertionError("invalid approval accepted")
 except sqlite3.IntegrityError: pass
db.execute("UPDATE account_deletion_reviews SET proposed_by=2,plan_digest=?,approved_by=3,version=3 WHERE id=100",(digest,))
assert db.execute("SELECT approved_by FROM account_deletion_reviews WHERE id=100").fetchone()[0]==3
# Neither request nor account can be physically erased through FK cascades.
for sql in ["DELETE FROM account_deletion_requests WHERE id=10","DELETE FROM users WHERE id=1"]:
 try: db.execute(sql); raise AssertionError("review dependencies did not restrict deletion")
 except sqlite3.IntegrityError: pass
print("PASS: review storage scope, requester exclusion, CAS versioning, independent approval, append-only audit, and restrictive retention.")
`;
const result = spawnSync("python3", ["-c", python], { input: migration, encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || "");
  process.stdout.write(result.stdout || "");
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
assert.match(migration, /BEFORE UPDATE ON account_deletion_review_events/);
assert.match(migration, /BEFORE DELETE ON account_deletion_review_events/);
assert.match(migration, /version must increment exactly once/);
console.log("PASS: account deletion review migration policy.");
