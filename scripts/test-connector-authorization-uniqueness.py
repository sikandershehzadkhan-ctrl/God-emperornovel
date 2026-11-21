import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.executescript((root / "migrations/0001_initial.sql").read_text(encoding="utf-8"))
db.executescript((root / "migrations/0048_omniportal_runtime_support.sql").read_text(encoding="utf-8"))
migration = (root / "migrations/0049_unique_pending_connector_authorization.sql").read_text(encoding="utf-8")

# A clean database accepts one pending request per connector.
db.execute("INSERT INTO connector_authorization_requests(connector_id,user_id,status) VALUES(1,10,'pending')")
db.executescript(migration)
try:
    db.execute("INSERT INTO connector_authorization_requests(connector_id,user_id,status) VALUES(1,11,'pending')")
    raise AssertionError("A second pending request for the same connector was accepted")
except sqlite3.IntegrityError:
    pass

# Different connectors may each have one pending request.
db.execute("INSERT INTO connector_authorization_requests(connector_id,user_id,status) VALUES(2,12,'pending')")

# A reviewed request remains in history and a new pending request is allowed.
db.execute("UPDATE connector_authorization_requests SET status='approved' WHERE connector_id=1 AND status='pending'")
db.execute("INSERT INTO connector_authorization_requests(connector_id,user_id,status) VALUES(1,13,'pending')")
assert db.execute("SELECT COUNT(*) FROM connector_authorization_requests WHERE connector_id=1").fetchone()[0] == 3

# Existing duplicate pending data must stop migration instead of being silently altered.
dirty = sqlite3.connect(":memory:")
dirty.executescript((root / "migrations/0001_initial.sql").read_text(encoding="utf-8"))
dirty.executescript((root / "migrations/0048_omniportal_runtime_support.sql").read_text(encoding="utf-8"))
dirty.executemany(
    "INSERT INTO connector_authorization_requests(connector_id,user_id,status) VALUES(7,?,'pending')",
    [(20,), (21,)]
)
try:
    dirty.executescript(migration)
    raise AssertionError("Migration should fail when duplicate pending rows already exist")
except sqlite3.IntegrityError:
    pass

print("PASS: connector authorization uniqueness, request-history preservation, reviewed re-request, and dirty-data migration stop.")
