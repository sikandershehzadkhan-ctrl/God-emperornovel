import concurrent.futures
import os
import re
import sqlite3
import tempfile
from pathlib import Path

source = Path("src/runtime-feature-schema.mjs").read_text(encoding="utf-8")
# Execute the exact trigger SQL literals used by the runtime bootstrap, not a hand-copied approximation.
trigger_sql = [part.strip() for part in source.split(chr(96)) if part.strip().startswith("CREATE TRIGGER IF NOT EXISTS")]
assert len(trigger_sql) == 4, f"expected four runtime triggers, found {len(trigger_sql)}"
assert all("BEGIN" in sql and sql.rstrip().endswith("END") for sql in trigger_sql)
assert not any(re.search(r"BEGIN\s*END$", sql) for sql in trigger_sql), "empty trigger body found"

def ddl_for(name):
    match = re.search(r'"(CREATE TABLE IF NOT EXISTS ' + re.escape(name) + r' [^"]+)"', source)
    assert match, f"runtime table DDL missing for {name}"
    return match.group(1)

def index_statements():
    return re.findall(r'"(CREATE INDEX IF NOT EXISTS idx_community_rate_limit_[^"]+)"', source)

backfill = re.search(r'"(INSERT OR IGNORE INTO comment_report_claims\(user_id,comment_id\) SELECT DISTINCT [^"]+)"', source)
assert backfill, "runtime duplicate-report claim backfill missing"

SCHEMA = [
    "CREATE TABLE users (id INTEGER PRIMARY KEY)",
    "CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, body TEXT NOT NULL, parent_id INTEGER)",
    ddl_for("comment_reports"),
    ddl_for("community_rate_limit_events"),
    ddl_for("comment_report_claims"),
    *index_statements(),
]

def connect(path):
    db = sqlite3.connect(path, timeout=20)
    db.execute("PRAGMA busy_timeout=20000")
    db.execute("PRAGMA foreign_keys=ON")
    return db

def run_comment(path, i, user_id=1):
    db = connect(path)
    try:
        db.execute("INSERT INTO comments(user_id,novel_id,body) VALUES(?,?,?)", (user_id, 1, f"comment-{i}"))
        db.commit()
        return "accepted"
    except sqlite3.IntegrityError as exc:
        db.rollback()
        if "comment_hourly_limit" in str(exc):
            return "limited"
        raise
    finally:
        db.close()

def run_report(path, comment_id, user_id=1):
    db = connect(path)
    try:
        db.execute("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(?,?,?)", (user_id, comment_id, "spam"))
        db.commit()
        return "accepted"
    except sqlite3.IntegrityError as exc:
        db.rollback()
        message = str(exc)
        if "comment_report_hourly_limit" in message:
            return "limited"
        if "comment_report_claims.user_id" in message:
            return "duplicate"
        raise
    finally:
        db.close()

with tempfile.TemporaryDirectory() as directory:
    path = os.path.join(directory, "community.sqlite")
    db = connect(path)
    db.executescript((";" + chr(10)).join(SCHEMA) + ";")
    db.executemany("INSERT INTO users(id) VALUES(?)", [(1,), (2,), (3,), (4,)])
    db.execute("INSERT INTO comments(id,user_id,novel_id,body) VALUES(777,4,1,'legacy')")
    db.executemany(
        "INSERT INTO comments(id,user_id,novel_id,body) VALUES(?,?,?,?)",
        [(1000+i,1,1,f"report-{i}") for i in range(24)] + [(9999,2,1,"duplicate")]
    )
    # Simulate legacy duplicate and orphan reports, then apply the exact runtime backfill.
    db.execute("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(4,777,'spam')")
    db.execute("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(4,777,'other')")
    db.execute("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(999,777,'spam')")
    db.execute("INSERT INTO comment_reports(user_id,comment_id,reason) VALUES(4,999,'spam')")
    db.execute(backfill.group(1))
    for sql in trigger_sql:
        db.execute(sql)
    db.commit()
    db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        outcomes = list(pool.map(lambda i: run_comment(path, i), range(24)))
    assert outcomes.count("accepted") == 10, outcomes
    assert outcomes.count("limited") == 14, outcomes
    db = connect(path)
    assert db.execute("SELECT COUNT(*) FROM comments WHERE user_id=1").fetchone()[0] == 34
    assert db.execute("SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='comment' AND user_id=1").fetchone()[0] == 10
    db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        outcomes = list(pool.map(lambda i: run_report(path, 1000 + i), range(24)))
    assert outcomes.count("accepted") == 10, outcomes
    assert outcomes.count("limited") == 14, outcomes
    db = connect(path)
    assert db.execute("SELECT COUNT(*) FROM comment_reports WHERE user_id=1").fetchone()[0] == 10
    assert db.execute("SELECT COUNT(*) FROM comment_report_claims WHERE user_id=1").fetchone()[0] == 10
    db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda _: run_report(path, 9999, user_id=2), range(2)))
    assert outcomes.count("accepted") == 1, outcomes
    assert outcomes.count("duplicate") == 1, outcomes
    assert run_report(path, 777, user_id=4) == "duplicate", "legacy duplicate reports must be backfilled"

    db = connect(path)
    assert db.execute("SELECT COUNT(*) FROM comment_report_claims WHERE user_id=999 OR comment_id=999").fetchone()[0] == 0, "orphan legacy reports must not create invalid claims"
    db.execute("INSERT INTO community_rate_limit_events(scope,user_id) VALUES('report',2)")
    db.execute("DELETE FROM users WHERE id=2")
    assert db.execute("SELECT COUNT(*) FROM community_rate_limit_events WHERE user_id=2").fetchone()[0] == 0, "user deletion must cascade rate-limit events"
    assert db.execute("SELECT COUNT(*) FROM comment_report_claims WHERE user_id=2").fetchone()[0] == 0, "user deletion must cascade report claims"
    db.execute("DELETE FROM comments WHERE id=777")
    assert db.execute("SELECT COUNT(*) FROM comment_report_claims WHERE comment_id=777").fetchone()[0] == 0, "comment deletion must cascade report claims"
    db.execute("INSERT INTO community_rate_limit_events(scope,user_id,created_at) VALUES('comment',3,datetime('now','-3 days'))")
    db.commit()
    db.close()

    assert run_comment(path, 1, user_id=3) == "accepted"
    db = connect(path)
    assert db.execute("SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='comment' AND user_id=3 AND created_at<datetime('now','-2 days')").fetchone()[0] == 0, "comment inserts must prune expired events"
    db.close()

print("PASS: actual runtime trigger SQL enforces concurrent quotas, duplicate claims, orphan-safe backfill, cascades and cleanup.")
