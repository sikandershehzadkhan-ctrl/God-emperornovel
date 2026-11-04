import sqlite3
import tempfile
import threading
from pathlib import Path

# Replay the complete canonical migration chain, including the new additive claim migration.
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

project_columns = {row[1] for row in db.execute("PRAGMA table_info(ai_author_projects)")}
job_columns = {row[1] for row in db.execute("PRAGMA table_info(ai_chapter_jobs)")}
for name in ("active_run_token", "active_run_started_at", "active_run_owner_user_id"):
    if name not in project_columns:
        raise SystemExit(f"FAIL: migration missing ai_author_projects.{name}")
if "run_token" not in job_columns:
    raise SystemExit("FAIL: migration missing ai_chapter_jobs.run_token")

# Use a file-backed database so two independent SQLite connections contend for
# the same conditional UPDATE, mirroring concurrent Worker requests.
with tempfile.NamedTemporaryFile(suffix=".sqlite") as temp:
    path = temp.name
    seed = sqlite3.connect(path)
    seed.execute("PRAGMA foreign_keys=ON")
    for migration in sorted(Path("migrations").glob("*.sql")):
        seed.executescript(migration.read_text(encoding="utf-8"))
    seed.execute("INSERT INTO users(username,email,password_hash,role) VALUES('writer','writer@example.test','x','author')")
    seed.execute("INSERT INTO novels(title,author) VALUES('Test novel','Writer')")
    seed.execute("INSERT INTO ai_author_projects(owner_user_id,novel_id,name,status) VALUES(1,1,'Atomic test','draft')")
    seed.commit()
    seed.close()

    barrier = threading.Barrier(2)
    outcomes = []
    errors = []
    lock = threading.Lock()

    def claim(token):
        try:
            conn = sqlite3.connect(path, timeout=10, isolation_level=None)
            conn.execute("PRAGMA busy_timeout=10000")
            barrier.wait()
            conn.execute(
                """UPDATE ai_author_projects
                   SET status='running',active_run_token=?,
                       active_run_started_at=CURRENT_TIMESTAMP,
                       active_run_owner_user_id=1
                   WHERE id=1 AND (
                     status!='running' OR
                     (active_run_started_at IS NOT NULL AND
                      active_run_started_at<=datetime('now','-30 minutes'))
                   )""",
                (token,)
            )
            changed = conn.execute("SELECT changes()").fetchone()[0]
            with lock:
                outcomes.append((token, changed))
            conn.close()
        except Exception as exc:
            with lock:
                errors.append(str(exc))

    threads = [
        threading.Thread(target=claim, args=("claim-A",)),
        threading.Thread(target=claim, args=("claim-B",))
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    if errors:
        raise SystemExit("FAIL: concurrent claim test raised: " + "; ".join(errors))
    winners = [token for token, changed in outcomes if changed == 1]
    if len(winners) != 1:
        raise SystemExit(f"FAIL: expected exactly one concurrent winner, got {outcomes}")

    # Simulate a run that exceeded the recovery window, then let a new token
    # take over. The late worker's token-fenced chapter insert and project update
    # must both affect zero rows.
    conn = sqlite3.connect(path)
    conn.execute("UPDATE ai_author_projects SET active_run_started_at=datetime('now','-31 minutes') WHERE id=1")
    conn.commit()
    conn.execute(
        """UPDATE ai_author_projects
           SET status='running',active_run_token='new-claim',
               active_run_started_at=CURRENT_TIMESTAMP,active_run_owner_user_id=1
           WHERE id=1 AND (
             status!='running' OR
             (active_run_started_at IS NOT NULL AND
              active_run_started_at<=datetime('now','-30 minutes'))
           )"""
    )
    if conn.execute("SELECT changes()").fetchone()[0] != 1:
        raise SystemExit("FAIL: stale claim could not be recovered")

    conn.execute(
        """INSERT INTO chapters(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status)
           SELECT 1,1,'Late chapter','late result',0,0,'draft'
           WHERE EXISTS(SELECT 1 FROM ai_author_projects WHERE id=1 AND active_run_token='old-claim')
             AND NOT EXISTS(SELECT 1 FROM chapters WHERE novel_id=1 AND chapter_number=1)"""
    )
    if conn.execute("SELECT changes()").fetchone()[0] != 0:
        raise SystemExit("FAIL: expired worker inserted a chapter after its claim was replaced")
    conn.execute("UPDATE ai_author_projects SET chapters_generated=1 WHERE id=1 AND active_run_token='old-claim'")
    if conn.execute("SELECT changes()").fetchone()[0] != 0:
        raise SystemExit("FAIL: expired worker overwrote project progress")
    token = conn.execute("SELECT active_run_token FROM ai_author_projects WHERE id=1").fetchone()[0]
    if token != "new-claim":
        raise SystemExit("FAIL: late worker changed the replacement claim")
    conn.close()

print("PASS: exactly one concurrent AI run claim succeeds.")
print("PASS: stale claims can be replaced after 30 minutes.")
print("PASS: late workers cannot insert chapters or overwrite project progress.")
