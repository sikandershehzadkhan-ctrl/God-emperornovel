import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  tickets REAL NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL
);
""")
db.executescript(Path("migrations/0050_imperial_user_xp_ledger.sql").read_text(encoding="utf-8"))
db.executescript(Path("migrations/0051_server_backed_reading_sessions.sql").read_text(encoding="utf-8"))

db.executemany(
    "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
    [("reader_one", "one@example.test", "hash"), ("reader_two", "two@example.test", "hash")],
)
db.executemany(
    "INSERT INTO chapters(novel_id,chapter_number) VALUES(?,?)",
    [(10, 1), (10, 2)],
)
u1 = db.execute("SELECT id FROM users WHERE username='reader_one'").fetchone()[0]
u2 = db.execute("SELECT id FROM users WHERE username='reader_two'").fetchone()[0]
ch1 = db.execute("SELECT id FROM chapters WHERE chapter_number=1").fetchone()[0]
ch2 = db.execute("SELECT id FROM chapters WHERE chapter_number=2").fetchone()[0]
token_a = "a" * 64
token_b = "b" * 64
token_c = "c" * 64
token_d = "d" * 64

def must_reject(sql, params, label):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected database to reject " + label)

def add_session(user_id, chapter_id, token, required=60):
    cursor = db.execute(
        """INSERT INTO reading_sessions(
             user_id,chapter_id,token_hash,started_at,last_heartbeat_at,
             expires_at,required_active_seconds
           ) VALUES(?,?,?,?,?,?,?)""",
        (user_id, chapter_id, token, 1_700_000_000, 1_700_000_000,
         1_700_007_200, required),
    )
    return cursor.lastrowid

s1 = add_session(u1, ch1, token_a)
must_reject(
    """INSERT INTO reading_sessions(
         user_id,chapter_id,token_hash,started_at,last_heartbeat_at,
         expires_at,required_active_seconds
       ) VALUES(?,?,?,?,?,?,?)""",
    (u1, ch1, token_b, 1_700_000_000, 1_700_000_000, 1_700_007_200, 60),
    "a second active session for the same user and chapter",
)
s2 = add_session(u2, ch1, token_b)
s3 = add_session(u1, ch2, token_c)
assert db.execute("SELECT COUNT(*) FROM reading_sessions").fetchone()[0] == 3

must_reject(
    """INSERT INTO reading_sessions(
         user_id,chapter_id,token_hash,started_at,last_heartbeat_at,
         expires_at,required_active_seconds
       ) VALUES(?,?,?,?,?,?,?)""",
    (u1, ch2, "not-a-sha256-hash", 1_700_000_000, 1_700_000_000, 1_700_007_200, 60),
    "a non-SHA-256 token hash",
)
must_reject(
    """INSERT INTO reading_sessions(
         user_id,chapter_id,token_hash,started_at,last_heartbeat_at,
         expires_at,required_active_seconds
       ) VALUES(?,?,?,?,?,?,?)""",
    (u1, ch2, "d" * 64, 1_700_000_000, 1_700_000_000, 1_700_007_200, 5),
    "an unsafe minimum reading duration",
)

# Neither a short session nor a shallow progress report can be marked complete.
must_reject(
    "UPDATE reading_sessions SET required_active_seconds=30 WHERE id=?",
    (s1,),
    "rewriting the server-derived reading duration",
)
must_reject(
    "UPDATE reading_sessions SET expires_at=? WHERE id=?",
    (1_700_008_000, s1),
    "rewriting the server-issued session expiry",
)
must_reject(
    "UPDATE reading_sessions SET last_heartbeat_at=? WHERE id=?",
    (1_700_008_000, s1),
    "recording a heartbeat after session expiry",
)
must_reject(
    "UPDATE reading_sessions SET status='completed',completed_at=? WHERE id=?",
    (1_700_000_060, s1),
    "completion below the required active duration and progress threshold",
)
db.execute(
    """UPDATE reading_sessions
       SET active_seconds=75,max_progress_bp=9500,heartbeat_count=4,
           last_heartbeat_at=1_700_000_075
       WHERE id=?""",
    (s1,),
)
must_reject(
    "UPDATE reading_sessions SET active_seconds=70 WHERE id=?",
    (s1,),
    "moving accumulated active time backwards",
)
must_reject(
    "UPDATE reading_sessions SET max_progress_bp=9400 WHERE id=?",
    (s1,),
    "moving reported progress backwards",
)
db.execute(
    "UPDATE reading_sessions SET status='completed',completed_at=? WHERE id=?",
    (1_700_000_075, s1),
)
db.execute(
    """INSERT INTO reading_completions(
         user_id,chapter_id,source_session_id,completed_at,
         qualifying_seconds,progress_basis_points
       ) VALUES(?,?,?,?,?,?)""",
    (u1, ch1, s1, 1_700_000_075, 75, 9500),
)
assert db.execute(
    "SELECT COUNT(*) FROM reading_completions WHERE user_id=? AND chapter_id=?",
    (u1, ch1),
).fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM imperial_xp_ledger").fetchone()[0] == 0, (
    "the schema migration must not award XP"
)

# A fresh, separately qualified session still cannot create a second
# completion for the same user/chapter pair.
s4 = add_session(u1, ch1, token_d)
db.execute(
    """UPDATE reading_sessions
       SET active_seconds=90,max_progress_bp=9800,heartbeat_count=5,
           last_heartbeat_at=1_700_000_090
       WHERE id=?""",
    (s4,),
)
db.execute(
    "UPDATE reading_sessions SET status='completed',completed_at=? WHERE id=?",
    (1_700_000_090, s4),
)
must_reject(
    """INSERT INTO reading_completions(
         user_id,chapter_id,source_session_id,completed_at,
         qualifying_seconds,progress_basis_points
       ) VALUES(?,?,?,?,?,?)""",
    (u1, ch1, s4, 1_700_000_090, 90, 9800),
    "a second completion for the same user and chapter",
)
must_reject(
    "UPDATE reading_sessions SET active_seconds=100 WHERE id=?",
    (s1,),
    "rewriting terminal session evidence",
)
must_reject(
    "UPDATE reading_completions SET qualifying_seconds=1 WHERE user_id=? AND chapter_id=?",
    (u1, ch1),
    "rewriting immutable completion evidence",
)
must_reject(
    "UPDATE reading_sessions SET status='active' WHERE id=?",
    (s1,),
    "reactivating a terminal session",
)
must_reject(
    """INSERT INTO reading_completions(
         user_id,chapter_id,source_session_id,completed_at,
         qualifying_seconds,progress_basis_points
       ) VALUES(?,?,?,?,?,?)""",
    (u1, ch2, s3, 1_700_000_000, 60, 9500),
    "a completion whose session has not been completed",
)

# User deletion removes only that user's sessions/completions through declared FKs.
db.execute("DELETE FROM users WHERE id=?", (u1,))
assert db.execute("SELECT COUNT(*) FROM reading_sessions WHERE user_id=?", (u1,)).fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM reading_completions WHERE user_id=?", (u1,)).fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM reading_sessions WHERE user_id=?", (u2,)).fetchone()[0] == 1

indexes = {row[1] for row in db.execute("PRAGMA index_list(reading_sessions)")}
assert "idx_reading_sessions_one_active" in indexes
assert "idx_reading_sessions_user_started" in indexes
completion_indexes = {row[1] for row in db.execute("PRAGMA index_list(reading_completions)")}
assert "idx_reading_completions_user_completed" in completion_indexes
assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
print("Server-backed reading-session migration tests passed: token hashes, active-session uniqueness, completion gates, idempotent chapter completion, cascades and indexes.")
