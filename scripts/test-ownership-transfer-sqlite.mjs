import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/0012_novel_ownership_transfers.sql", import.meta.url), "utf8");
const python = String.raw`
import json, sqlite3, sys, time
payload = json.loads(sys.stdin.read())
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT NOT NULL, banned INTEGER NOT NULL DEFAULT 0);
CREATE TABLE novels (
  id INTEGER PRIMARY KEY, owner_user_id INTEGER NOT NULL,
  publication_status TEXT NOT NULL, rights_status TEXT NOT NULL,
  rights_evidence TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users(id, role, banned) VALUES
 (1, 'author', 0), (2, 'author', 0), (3, 'author', 1), (4, 'user', 0), (5, 'author', 0);
INSERT INTO novels(id, owner_user_id, publication_status, rights_status, rights_evidence) VALUES
 (10, 1, 'published', 'original', ''),
 (11, 1, 'published', 'original', ''),
 (12, 1, 'published', 'original', ''),
 (13, 1, 'published', 'original', ''),
 (14, 1, 'published', 'original', ''),
 (15, 1, 'published', 'original', ''),
 (16, 1, 'published', 'licensed', '');
""")
db.executescript(payload["migration"])
now = int(time.time())
def invite(novel, recipient, expiry=None):
    requested_at = now if expiry is None or expiry > now else expiry - 100
    db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,status,requested_at,expires_at) VALUES(?,?,?,'pending',?,?)",
               (novel, 1, recipient, requested_at, expiry if expiry is not None else now + 3600))
def accept(transfer_id, **changes):
    if changes:
        assignments = ",".join(k + "=?" for k in changes)
        db.execute("UPDATE novel_ownership_transfers SET " + assignments + ", status='accepted' WHERE id=?", (*changes.values(), transfer_id))
    else:
        db.execute("UPDATE novel_ownership_transfers SET status='accepted' WHERE id=?", (transfer_id,))
def state(novel, transfer_id):
    owner = db.execute("SELECT owner_user_id FROM novels WHERE id=?", (novel,)).fetchone()[0]
    status = db.execute("SELECT status FROM novel_ownership_transfers WHERE id=?", (transfer_id,)).fetchone()[0]
    return owner, status
# Eligible recipient: both ownership and invitation status commit.
invite(10, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
accept(transfer)
assert state(10, transfer) == (2, "accepted")
# Banned recipient is re-evaluated at acceptance, not just invitation time.
invite(11, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
db.execute("UPDATE users SET banned=1 WHERE id=2")
try: accept(transfer); raise AssertionError("banned recipient acceptance unexpectedly succeeded")
except sqlite3.IntegrityError: pass
assert state(11, transfer) == (1, "pending")
db.execute("UPDATE users SET banned=0 WHERE id=2")
# A recipient whose author role was revoked cannot accept.
invite(12, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
db.execute("UPDATE users SET role='user' WHERE id=2")
try: accept(transfer); raise AssertionError("non-author acceptance unexpectedly succeeded")
except sqlite3.IntegrityError: pass
assert state(12, transfer) == (1, "pending")
db.execute("UPDATE users SET role='author' WHERE id=2")
# Stale ownership cannot be overwritten by an old invitation.
invite(13, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
db.execute("UPDATE novels SET owner_user_id=5 WHERE id=13")
try: accept(transfer); raise AssertionError("stale owner acceptance unexpectedly succeeded")
except sqlite3.IntegrityError: pass
assert state(13, transfer) == (5, "pending")
# Expired invitations cannot be accepted even by direct SQL.
invite(14, 2, now - 1); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
try: accept(transfer); raise AssertionError("expired invitation acceptance unexpectedly succeeded")
except sqlite3.IntegrityError: pass
assert state(14, transfer) == (1, "pending")
# A caller cannot mutate invitation identity fields while accepting it.
invite(15, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
try:
    db.execute("UPDATE novel_ownership_transfers SET to_user_id=5, status='accepted' WHERE id=?", (transfer,))
    raise AssertionError("invitation identity mutation unexpectedly succeeded")
except sqlite3.IntegrityError: pass
assert state(15, transfer) == (1, "pending")
# Licensed works without evidence are ineligible even if the recipient is valid.
invite(16, 2); transfer = db.execute("SELECT last_insert_rowid()").fetchone()[0]
try: accept(transfer); raise AssertionError("licensed work without evidence unexpectedly transferred")
except sqlite3.IntegrityError: pass
assert state(16, transfer) == (1, "pending")
print("Ownership transfer SQLite behavior tests passed: atomic success, banned/role revocation, stale owner, expiry, immutable invitation identity, and rights evidence.")
`;
const result = spawnSync("python3", ["-c", python], {
  input: JSON.stringify({ migration }),
  encoding: "utf8"
});
if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || "");
  process.stdout.write(result.stdout || "");
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
