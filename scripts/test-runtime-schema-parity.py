import re
import sqlite3
from pathlib import Path

migration_sql = Path("migrations/0001_initial.sql").read_text(encoding="utf-8")
worker = Path("src/index.js").read_text(encoding="utf-8")
core_start = worker.index("async function ensureCoreSchema")
start = worker.index("const qs=[", core_start)
end = worker.index("];\n  for(const q of qs)", start)
block = worker[start:end]

# Runtime bootstrap uses template literals and double-quoted SQL literals.
matches = re.findall(r"`([^`]*)`|\"((?:\\\\.|[^\"\\\\])*)\"", block, re.S)
runtime_statements = [a if a else b for a, b in matches]
runtime_ddl = [sql for sql in runtime_statements if re.match(r"\s*CREATE TABLE IF NOT EXISTS ", sql, re.I)]
if not runtime_ddl:
    raise SystemExit("FAIL: no runtime CREATE TABLE statements were extracted")

def build(sql_statements):
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys=ON")
    for sql in sql_statements:
        db.execute(sql)
    return db

canonical = build([migration_sql])
runtime = build(runtime_ddl)

tables = [
    "users", "sessions", "novels", "chapters", "genres", "tags",
    "novel_genres", "novel_tags", "unlocks", "unlock_batches",
    "bookmarks", "history", "donations", "connectors", "comments",
    "novel_requests", "audit_logs"
]

def columns(db, table):
    return [
        (r[1], (r[2] or "").upper(), r[3], r[4], r[5])
        for r in db.execute(f"PRAGMA table_info({table})")
    ]

def foreign_keys(db, table):
    return sorted(
        (r[2], r[3], r[4], r[6].upper())
        for r in db.execute(f"PRAGMA foreign_key_list({table})")
    )

for table in tables:
    if columns(canonical, table) != columns(runtime, table):
        raise SystemExit(
            f"FAIL: {table} column parity mismatch\n"
            f"migration={columns(canonical, table)}\n"
            f"runtime={columns(runtime, table)}"
        )
    if foreign_keys(canonical, table) != foreign_keys(runtime, table):
        raise SystemExit(
            f"FAIL: {table} foreign-key parity mismatch\n"
            f"migration={foreign_keys(canonical, table)}\n"
            f"runtime={foreign_keys(runtime, table)}"
        )

for db, label in ((canonical, "migration"), (runtime, "runtime")):
    try:
        db.execute("INSERT INTO users(username,email,password_hash,role) VALUES('bad','bad@example.test','x','owner')")
    except sqlite3.IntegrityError:
        pass
    else:
        raise SystemExit(f"FAIL: {label} schema accepted an invalid user role")

print(f"PASS: runtime bootstrap matches migration 0001 columns/defaults/primary keys/foreign keys for {len(tables)} core tables.")
print("PASS: both initialization paths reject invalid user roles.")
