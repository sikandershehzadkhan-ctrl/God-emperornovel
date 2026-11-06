import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../migrations/0039_novel_ownership_transfers.sql",import.meta.url),"utf8");
const goalsBase=readFileSync(new URL("../migrations/0032_author_story_goals.sql",import.meta.url),"utf8");
const goalsOwner=readFileSync(new URL("../migrations/0047_author_story_goals_owner_scope.sql",import.meta.url),"utf8");
const py=String.raw`
import json,sqlite3,sys
data=json.load(sys.stdin)
sql=data["sql"]
goals_base=data["goalsBase"]
goals_owner=data["goalsOwner"]
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY,role TEXT NOT NULL,banned INTEGER NOT NULL DEFAULT 0);
CREATE TABLE novels(id INTEGER PRIMARY KEY,owner_user_id INTEGER NOT NULL,publication_status TEXT NOT NULL,rights_status TEXT NOT NULL,rights_evidence TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users(id,role,banned) VALUES(1,'author',0),(2,'author',0),(3,'reader',0),(4,'author',1);
INSERT INTO novels(id,owner_user_id,publication_status,rights_status,rights_evidence) VALUES
 (10,1,'published','original',''),
 (11,1,'published','licensed','license proof'),
 (12,1,'published','licensed',''),
 (13,1,'archived','original',''),
 (14,3,'published','original',''),
 (15,1,'published','original',''),
 (16,1,'published','original','');
""")
db.executescript(goals_base)
db.execute("INSERT INTO author_story_goals(owner_user_id,novel_id,target_chapters,target_words) VALUES(1,10,7,7000)")
db.executescript(sql)
def rejected(fn):
 try: fn()
 except sqlite3.IntegrityError: return
 raise AssertionError("invalid ownership transfer operation was accepted")
# Parent FKs and identity constraints.
rejected(lambda: db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(999,1,2,1,9999999999)"))
rejected(lambda: db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(10,1,999,1,9999999999)"))
rejected(lambda: db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(10,1,1,1,9999999999)"))
# Request is inert; duplicate pending invitation is blocked.
db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(10,1,2,1,9999999999)")
tid=db.execute("SELECT id FROM novel_ownership_transfers WHERE novel_id=10").fetchone()[0]
assert db.execute("SELECT owner_user_id FROM novels WHERE id=10").fetchone()[0]==1
rejected(lambda: db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(10,1,2,2,9999999999)"))
# Acceptance atomically changes owner and finalizes invitation.
db.execute("UPDATE novel_ownership_transfers SET status='accepted',decided_at=CAST(strftime('%s','now') AS INTEGER) WHERE id=?",(tid,))
assert db.execute("SELECT owner_user_id FROM novels WHERE id=10").fetchone()[0]==2
db.executescript(goals_owner)
db.execute("INSERT INTO author_story_goals(owner_user_id,novel_id,target_chapters,target_words) VALUES(2,10,12,12000)")
assert db.execute("SELECT owner_user_id,novel_id,target_chapters FROM author_story_goals WHERE novel_id=10 ORDER BY owner_user_id").fetchall()==[(1,10,7),(2,10,12)]
assert db.execute("SELECT status,decided_at FROM novel_ownership_transfers WHERE id=?",(tid,)).fetchone()[0]=='accepted'
# Terminal record cannot be rewritten or reopened.
rejected(lambda: db.execute("UPDATE novel_ownership_transfers SET status='pending',decided_at=NULL WHERE id=?",(tid,)))
rejected(lambda: db.execute("DELETE FROM novel_ownership_transfers WHERE id=?",(tid,)) if False else db.execute("UPDATE novel_ownership_transfers SET decision_note='tampered' WHERE id=?",(tid,)))
# Pending invitation cannot mutate identity or be finalized without a decision timestamp.
db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(11,1,2,1,9999999999)")
pending=db.execute("SELECT id FROM novel_ownership_transfers WHERE novel_id=11").fetchone()[0]
rejected(lambda: db.execute("UPDATE novel_ownership_transfers SET to_user_id=3 WHERE id=?",(pending,)))
rejected(lambda: db.execute("UPDATE novel_ownership_transfers SET status='rejected' WHERE id=?",(pending,)))
# Eligibility is rechecked at acceptance: reader, banned author, unverified licensed work, archived work fail.
for novel,recipient in [(15,3),(16,4),(12,2),(13,2)]:
 db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(?,1,?,1,9999999999)",(novel,recipient))
 transfer=db.execute("SELECT id FROM novel_ownership_transfers WHERE novel_id=? ORDER BY id DESC",(novel,)).fetchone()[0]
 rejected(lambda: db.execute("UPDATE novel_ownership_transfers SET status='accepted',decided_at=CAST(strftime('%s','now') AS INTEGER) WHERE id=?",(transfer,)))
# Expiry is enforced at acceptance and does not mutate ownership.
db.execute("INSERT INTO novel_ownership_transfers(novel_id,from_user_id,to_user_id,requested_at,expires_at) VALUES(14,3,2,1,2)")
expired=db.execute("SELECT id FROM novel_ownership_transfers WHERE novel_id=14").fetchone()[0]
rejected(lambda: db.execute("UPDATE novel_ownership_transfers SET status='accepted',decided_at=CAST(strftime('%s','now') AS INTEGER) WHERE id=?",(expired,)))
assert db.execute("SELECT owner_user_id FROM novels WHERE id=14").fetchone()[0]==3
# Parent rows cannot be erased while transfer history references them.
rejected(lambda: db.execute("DELETE FROM users WHERE id=1"))
rejected(lambda: db.execute("DELETE FROM novels WHERE id=10"))
assert db.execute("PRAGMA integrity_check").fetchone()[0]=='ok'
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
print("PASS: ownership transfer FK retention, inert requests, duplicate prevention, atomic acceptance, immutable history, recipient/rights/publication rechecks, and expiry.")
`;
const result=spawnSync("python3",["-c",py],{input:JSON.stringify({sql,goalsBase,goalsOwner}),encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
