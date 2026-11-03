#!/usr/bin/env python3
"""Apply the repository migration chain to disposable SQLite and inspect integrity."""
from pathlib import Path
import sqlite3
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"


def fail(message: str) -> None:
    print(f"::error::{message}")
    raise SystemExit(1)


def main() -> None:
    paths = sorted(MIGRATIONS.glob("*.sql"), key=lambda item: item.name)
    if not paths:
        fail("No SQL migrations found.")

    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")

    try:
        for path in paths:
            try:
                db.executescript(path.read_text(encoding="utf-8-sig"))
            except sqlite3.Error as exc:
                fail(f"Migration failed: {path.name}: {exc}")
            print(f"PASS: applied {path.name}")

        integrity = db.execute("PRAGMA integrity_check").fetchall()
        if integrity != [("ok",)]:
            fail(f"SQLite integrity_check reported: {integrity!r}")

        foreign_key_errors = db.execute("PRAGMA foreign_key_check").fetchall()
        if foreign_key_errors:
            fail(
                "Foreign-key violations after fresh migration chain: "
                f"{foreign_key_errors[:20]!r}"
            )

        objects = db.execute(
            """
            SELECT type, COUNT(*)
            FROM sqlite_master
            WHERE name NOT LIKE 'sqlite_%'
            GROUP BY type
            ORDER BY type
            """
        ).fetchall()
        tables = db.execute(
            "SELECT COUNT(*) FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchone()[0]

        print(f"PASS: {len(paths)} migrations applied to disposable SQLite.")
        print("PASS: SQLite integrity_check = ok.")
        print("PASS: PRAGMA foreign_key_check returned no violations.")
        print(f"Schema objects: {objects!r}")
        print(f"Application tables created: {tables}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
