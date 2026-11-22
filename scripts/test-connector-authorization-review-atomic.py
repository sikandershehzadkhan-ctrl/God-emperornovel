import re
import sqlite3
from pathlib import Path

worker = Path("src/index.js").read_text(encoding="utf-8")
claim = re.search(r'prepare\("(UPDATE connector_authorization_requests SET status=\?[^"]+)"\)', worker)
update = re.search(r'prepare\("(UPDATE connectors SET rights_status=\?[^"]+)"\)', worker)
assert claim and update, "Could not extract connector review batch SQL from Worker"
claim_sql, connector_sql = claim.group(1), update.group(1)

def fixture(with_connector=True):
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE connectors(
        id INTEGER PRIMARY KEY, rights_status TEXT NOT NULL, enabled INTEGER NOT NULL,
        rights_evidence_url TEXT DEFAULT '', terms_url TEXT DEFAULT '', rights_notes TEXT DEFAULT '',
        metadata_import_allowed INTEGER DEFAULT 0, attribution_required INTEGER DEFAULT 0
      );
      CREATE TABLE connector_authorization_requests(
        id INTEGER PRIMARY KEY, connector_id INTEGER NOT NULL, status TEXT NOT NULL,
        reviewed_by INTEGER, reviewed_at TEXT, review_notes TEXT DEFAULT '',
        evidence_url TEXT DEFAULT '', terms_url TEXT DEFAULT '', notes TEXT DEFAULT '',
        metadata_import_allowed INTEGER DEFAULT 0, attribution_required INTEGER DEFAULT 0
      );
      INSERT INTO connector_authorization_requests(id,connector_id,status,evidence_url)
      VALUES(1,10,'pending','https://rights.example/evidence');
    """)
    if with_connector:
        db.execute("INSERT INTO connectors(id,rights_status,enabled) VALUES(10,'pending',0)")
    return db

def run_review(db, reviewer, decision):
    first = db.execute(claim_sql, (decision, reviewer, "reviewed", 1))
    second = db.execute(connector_sql, (
        "authorized" if decision == "approved" else "rejected",
        "https://rights.example/evidence", "", "", 0, 1, 10
    ))
    return first.rowcount, second.rowcount

# The first review updates both rows; a competing reviewer changes neither.
db = fixture()
assert run_review(db, 101, "approved") == (1, 1)
assert run_review(db, 202, "rejected") == (0, 0)
assert db.execute("SELECT status,reviewed_by FROM connector_authorization_requests WHERE id=1").fetchone() == ("approved", 101)
assert db.execute("SELECT rights_status,enabled FROM connectors WHERE id=10").fetchone() == ("authorized", 0)

# If the connector is absent, the request must remain pending rather than half-transitioning.
orphan = fixture(with_connector=False)
assert run_review(orphan, 303, "approved") == (0, 0)
assert orphan.execute("SELECT status,reviewed_by FROM connector_authorization_requests WHERE id=1").fetchone() == ("pending", None)

print("PASS: connector authorization review batch is compare-and-set, updates both records only for the winning reviewer, and leaves orphan requests pending.")
