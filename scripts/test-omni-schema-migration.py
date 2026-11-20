import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript((root / "migrations/0001_initial.sql").read_text(encoding="utf-8"))
migration = (root / "migrations/0047_omniportal_runtime_support.sql").read_text(encoding="utf-8")
db.executescript(migration)
# CREATE TABLE/INDEX IF NOT EXISTS makes the migration safe for databases where
# the former lazy GET initializer already provisioned these exact tables.
db.executescript(migration)

expected = {
    "connector_events": {"id", "connector_id", "event", "status", "details", "created_at"},
    "import_jobs": {"id", "user_id", "connector_id", "source_url", "status", "message", "created_at", "updated_at"},
    "recommendations": {"id", "user_id", "novel_id", "reason", "score", "created_at"},
    "connector_authorization_requests": {
        "id", "connector_id", "user_id", "status", "evidence_url", "terms_url",
        "notes", "metadata_import_allowed", "attribution_required", "reviewed_by",
        "reviewed_at", "review_notes", "created_at"
    },
}
for table, required in expected.items():
    columns = {row[1] for row in db.execute(f"PRAGMA table_info({table})")}
    assert required <= columns, f"{table} missing columns: {sorted(required - columns)}"

indexes = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='index'")}
assert {"idx_connector_events_connector", "idx_import_jobs_user", "idx_connector_auth_requests_status"} <= indexes

print("PASS: migration 0047 provisions every OmniPortal read dependency and is safe to replay when the lazy initializer already created the tables.")
