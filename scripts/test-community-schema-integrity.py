#!/usr/bin/env python3
"""Exercise migration 0012 against the pre-existing, unconstrained community schema."""
import sqlite3
from pathlib import Path

migration = Path("migrations/0012_runtime_feature_schema.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE comments(id INTEGER PRIMARY KEY);
CREATE TABLE novels(id INTEGER PRIMARY KEY);
CREATE TABLE novel_requests(id INTEGER PRIMARY KEY);
-- These tables model installations created by the earlier runtime bootstrap/migration.
CREATE TABLE comment_likes(user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,comment_id));
CREATE TABLE comment_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,comment_id INTEGER NOT NULL,reason TEXT NOT NULL,details TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE novel_reactions(user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,reaction TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id));
CREATE TABLE request_votes(request_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(request_id,user_id));
INSERT INTO users VALUES(1);
INSERT INTO comments VALUES(10);
INSERT INTO novels VALUES(20);
INSERT INTO novel_requests VALUES(30);
INSERT INTO comment_reports(user_id,comment_id,reason,details) VALUES(1,10,'spam','keep earliest');
INSERT INTO comment_reports(user_id,comment_id,reason,details) VALUES(1,10,'copyright','preserve duplicate');
INSERT INTO comment_reports(user_id,comment_id,reason,details) VALUES(999,10,'spam','orphan user report');
INSERT INTO comment_reports(user_id,comment_id,reason,details) VALUES(1,999,'spam','orphan comment report');
INSERT INTO comment_likes(user_id,comment_id) VALUES(1,10);
INSERT INTO comment_likes(user_id,comment_id) VALUES(999,10);
INSERT INTO novel_reactions(user_id,novel_id,reaction) VALUES(1,20,'love');
INSERT INTO novel_reactions(user_id,novel_id,reaction) VALUES(1,999,'fire');
INSERT INTO request_votes(request_id,user_id) VALUES(30,1);
INSERT INTO request_votes(request_id,user_id) VALUES(999,1);
""")

# Existing CREATE TABLE IF NOT EXISTS definitions remain unchanged. The migration
# must therefore add equivalent integrity behavior with triggers.
db.executescript(migration)
db.executescript(migration)  # Must be safe to re-run.

archived = db.execute(
    "SELECT reason,details,archive_reason FROM comment_reports_legacy_duplicates ORDER BY id"
).fetchall()
active = db.execute(
    "SELECT reason,details FROM comment_reports"
).fetchall()
assert archived == [
    ("copyright", "preserve duplicate", "duplicate"),
    ("spam", "orphan user report", "orphan_reference"),
    ("spam", "orphan comment report", "orphan_reference"),
], archived
assert active == [("spam", "keep earliest")], active
for table in ("comment_likes", "novel_reactions", "request_votes"):
    assert db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 1, table

def rejected(sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected referential-integrity rejection: " + sql)

rejected("INSERT INTO comment_likes(user_id,comment_id) VALUES(999,10)")
rejected("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(999,10,'spam')")
rejected("INSERT INTO novel_reactions(user_id,novel_id,reaction) VALUES(999,20,'love')")
rejected("INSERT INTO request_votes(request_id,user_id) VALUES(30,999)")
rejected("UPDATE comment_likes SET comment_id=999 WHERE user_id=1 AND comment_id=10")
rejected("UPDATE comment_reports SET comment_id=999 WHERE user_id=1 AND comment_id=10")
rejected("UPDATE novel_reactions SET novel_id=999 WHERE user_id=1 AND novel_id=20")
rejected("UPDATE request_votes SET request_id=999 WHERE request_id=30 AND user_id=1")

# Parent deletion must cascade for pre-existing tables as well as fresh schemas.
db.execute("DELETE FROM comments WHERE id=10")
assert db.execute("SELECT COUNT(*) FROM comment_likes").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM comment_reports").fetchone()[0] == 0
db.execute("DELETE FROM novels WHERE id=20")
assert db.execute("SELECT COUNT(*) FROM novel_reactions").fetchone()[0] == 0
db.execute("DELETE FROM novel_requests WHERE id=30")
assert db.execute("SELECT COUNT(*) FROM request_votes").fetchone()[0] == 0

# User deletion is independently covered for every interaction table.
db.executescript("""
INSERT INTO users VALUES(2);
INSERT INTO comments VALUES(11);
INSERT INTO novels VALUES(21);
INSERT INTO novel_requests VALUES(31);
INSERT INTO comment_likes(user_id,comment_id) VALUES(2,11);
INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(2,11,'spam');
INSERT INTO novel_reactions(user_id,novel_id,reaction) VALUES(2,21,'fire');
INSERT INTO request_votes(request_id,user_id) VALUES(31,2);
DELETE FROM users WHERE id=2;
""")
for table in ("comment_likes", "comment_reports", "novel_reactions", "request_votes"):
    assert db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 0, table

print("PASS: migration 0012 archives duplicate/orphan report history, cleans orphan interactions, upgrades legacy integrity, cascades deletes, and is idempotent.")
