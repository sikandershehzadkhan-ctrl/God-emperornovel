import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

def user(index):
    name = f"creator{index}"
    db.execute(
        "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
        (name, f"{name}@example.test", "hash"),
    )
    return db.execute("SELECT last_insert_rowid()").fetchone()[0]

def add_asset(owner_id, number, size=20*1024*1024, status="pending_upload"):
    db.execute(
        "INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes,status) VALUES(?,?, 'image/webp', ?, ?)",
        (owner_id, f"private/{owner_id}/{number}", size, status),
    )

def must_fail(fn, message):
    try:
        fn()
    except sqlite3.IntegrityError as error:
        assert "quota exceeded" in str(error), f"Unexpected constraint: {error}"
        return
    raise AssertionError(message)

owners = [user(i) for i in range(1, 12)]
# Per-creator hard cap is 100 MiB, even while files are pending or rejected.
for i in range(5):
    add_asset(owners[0], i + 1)
must_fail(lambda: add_asset(owners[0], 6), "Creator quota should reject a sixth 20 MiB asset")
db.execute("UPDATE media_assets SET status='rejected' WHERE owner_user_id=? AND id=(SELECT MIN(id) FROM media_assets WHERE owner_user_id=?)", (owners[0], owners[0]))
must_fail(lambda: add_asset(owners[0], 7), "Rejected objects must continue consuming quota until deletion")
db.execute("UPDATE media_assets SET status='deleted' WHERE owner_user_id=? AND id=(SELECT MIN(id) FROM media_assets WHERE owner_user_id=?)", (owners[0], owners[0]))
deleted_at = db.execute("SELECT deleted_at FROM media_assets WHERE owner_user_id=? AND status='deleted'", (owners[0],)).fetchone()[0]
assert deleted_at is not None, "Deleting an asset must stamp deleted_at"
add_asset(owners[0], 8)

# Owner changes cannot move an asset into an account already at its quota.
add_asset(owners[1], 1, size=1024)
must_fail(
    lambda: db.execute("UPDATE media_assets SET owner_user_id=? WHERE owner_user_id=? AND object_key=?",
                       (owners[0], owners[1], f"private/{owners[1]}/1")),
    "Ownership reassignment must respect the destination owner's quota",
)

# Platform cap is 1 GiB. Ten creators can fill exactly 1 GiB at 100 MiB each.
for owner_id in owners[1:10]:
    for i in range(5):
        add_asset(owner_id, i + 2 if owner_id == owners[1] else i + 1)
# The second creator has an extra 1 KiB test asset, so the platform cap is already reached.
must_fail(lambda: add_asset(owners[10], 1, size=1), "Platform quota should reject additional storage")
print("PASS: per-creator 100 MiB quota, platform 1 GiB cap, rejected-object accounting, deletion release, and owner-reassignment enforcement.")
