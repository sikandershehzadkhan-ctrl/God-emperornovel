import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")

# Rehearse the complete checked-in migration chain, not a hand-built mock table.
migration_files = sorted(Path("migrations").glob("*.sql"))
assert migration_files, "No migrations found"
for migration_file in migration_files:
    db.executescript(migration_file.read_text())

db.executemany(
    "INSERT INTO users(id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [
        (1, "reader_one", "one@example.test", "hash-one", "author"),
        (2, "reader_two", "two@example.test", "hash-two", "author"),
    ],
)

# Create a legacy name-attributed work, a work owned by another account with
# the same display string, and an explicitly account-owned work.
db.executemany(
    """INSERT INTO novels
       (title, author, owner_user_id, publication_status, rights_status)
       VALUES (?, ?, ?, 'published', 'original')""",
    [
        ("Legacy author work", "reader_one", None),
        ("Another account work", "reader_one", 2),
        ("Explicitly owned work", "Updated Author", 1),
    ],
)

# A rename must preserve the old identity in private history.
db.execute("UPDATE users SET username=? WHERE id=?", ("reader_new", 1))
history = db.execute(
    "SELECT user_id, old_username FROM username_history WHERE user_id=1"
).fetchone()
assert history == (1, "reader_one"), history

# Historical names cannot be claimed by another account, even if the API
# pre-check were bypassed.
try:
    db.execute("UPDATE users SET username=? WHERE id=?", ("reader_one", 2))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("A different account reclaimed a historical username")

# Profile work lookup must preserve legacy unowned rows but never expose a
# novel explicitly owned by a different account.
rows = db.execute(
    """SELECT title FROM novels
       WHERE (
         owner_user_id=?
         OR (
           owner_user_id IS NULL
           AND (
             LOWER(author) IN (LOWER(?), LOWER(?))
             OR LOWER(author) IN (
               SELECT LOWER(old_username) FROM username_history WHERE user_id=?
             )
           )
         )
       )
       AND publication_status='published'
       AND rights_status IN ('original','public_domain','licensed','authorized')
       ORDER BY title""",
    (1, "Updated Author", "reader_new", 1),
).fetchall()
titles = [row[0] for row in rows]
assert titles == ["Explicitly owned work", "Legacy author work"], titles
assert "Another account work" not in titles

# Case-insensitive duplicates are rejected by the database, not just the API.
try:
    db.execute("UPDATE users SET username=? WHERE id=?", ("READER_NEW", 2))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("A case-variant username collision was accepted")

# A current username remains changeable after satisfying the cooldown field.
db.execute(
    "UPDATE users SET username_changed_at='2000-01-01 00:00:00' WHERE id=1"
)
db.execute("UPDATE users SET username=? WHERE id=?", ("reader_final", 1))
assert db.execute(
    "SELECT username FROM users WHERE id=1"
).fetchone()[0] == "reader_final"

print("Full D1 migration chain and account identity isolation rehearsal passed.")
