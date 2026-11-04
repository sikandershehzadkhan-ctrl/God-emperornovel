import concurrent.futures
import os
import sqlite3
import tempfile

SCHEMA = """
CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, body TEXT NOT NULL, parent_id INTEGER);
CREATE TABLE comment_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, comment_id INTEGER NOT NULL, reason TEXT NOT NULL, details TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE community_rate_limit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL CHECK(scope IN ('comment','report')), user_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_community_rate_limit_scope_user_created ON community_rate_limit_events(scope,user_id,created_at);
CREATE INDEX idx_community_rate_limit_created ON community_rate_limit_events(created_at);
CREATE TABLE comment_report_claims (user_id INTEGER NOT NULL, comment_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,comment_id));
CREATE TRIGGER trg_comments_hourly_limit
BEFORE INSERT ON comments
BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='comment' AND user_id=NEW.user_id AND created_at>=datetime('now','-1 hour')) >= 10
   THEN RAISE(ABORT,'comment_hourly_limit') END;
 INSERT INTO community_rate_limit_events(scope,user_id) VALUES('comment',NEW.user_id);
END;
CREATE TRIGGER trg_comment_reports_hourly_limit_and_claim
BEFORE INSERT ON comment_reports
BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM community_rate_limit_events WHERE scope='report' AND user_id=NEW.user_id AND created_at>=datetime('now','-1 hour')) >= 10
   THEN RAISE(ABORT,'comment_report_hourly_limit') END;
 INSERT INTO comment_report_claims(user_id,comment_id) VALUES(NEW.user_id,NEW.comment_id);
 INSERT INTO community_rate_limit_events(scope,user_id) VALUES('report',NEW.user_id);
END;
"""

def connect(path):
    db = sqlite3.connect(path, timeout=20)
    db.execute("PRAGMA busy_timeout=20000")
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
    db.executescript(SCHEMA)
    db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        outcomes = list(pool.map(lambda i: run_comment(path, i), range(24)))
    assert outcomes.count("accepted") == 10, outcomes
    assert outcomes.count("limited") == 14, outcomes
    db = connect(path)
    assert db.execute("SELECT COUNT(*) FROM comments WHERE user_id=1").fetchone()[0] == 10
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

    db = connect(path)
    db.execute("INSERT INTO community_rate_limit_events(scope,user_id,created_at) VALUES('comment',3,datetime('now','-2 hours'))")
    db.commit()
    db.close()
    assert run_comment(path, 1, user_id=3) == "accepted"

print("PASS: concurrent comments and reports are capped at 10 per rolling hour; duplicate reports are serialized.")
