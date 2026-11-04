#!/usr/bin/env python3
"""Read-only audit of a SQLite backup against Imperial Novel's canonical core schema.

This tool never writes to the inspected database. Use a local, verified backup/export;
it does not connect to Cloudflare or production.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path
from urllib.parse import quote


def rows(conn: sqlite3.Connection, sql: str, args: tuple = ()) -> list[tuple]:
    return [tuple(row) for row in conn.execute(sql, args).fetchall()]


def table_names(conn: sqlite3.Connection) -> set[str]:
    return {r[0] for r in rows(
        conn,
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )}


def foreign_keys(conn: sqlite3.Connection, table: str) -> list[tuple]:
    return sorted(rows(conn, f'PRAGMA foreign_key_list("{table}")'))


def column_signature(conn: sqlite3.Connection, table: str) -> list[tuple]:
    return [
        (r[1], (r[2] or "").upper(), int(r[3]), r[4], int(r[5]))
        for r in rows(conn, f'PRAGMA table_info("{table}")')
    ]


def unique_index_signature(conn: sqlite3.Connection, table: str) -> list[tuple]:
    result = []
    for index in rows(conn, f'PRAGMA index_list("{table}")'):
        # seq, name, unique, origin, partial
        if not int(index[2]):
            continue
        name = index[1].replace('"', '""')
        cols = tuple(r[2] for r in rows(conn, f'PRAGMA index_info("{name}")'))
        result.append((cols, int(index[4]) if len(index) > 4 else 0))
    return sorted(result)


def orphan_count(conn: sqlite3.Connection, child: str, parent: str,
                 child_cols: list[str], parent_cols: list[str]) -> int:
    predicates = " AND ".join(
        f'p."{pc}" = c."{cc}"' for cc, pc in zip(child_cols, parent_cols)
    )
    present = " AND ".join(f'c."{cc}" IS NOT NULL' for cc in child_cols)
    sql = (
        f'SELECT COUNT(*) FROM "{child}" c '
        f'WHERE {present} AND NOT EXISTS '
        f'(SELECT 1 FROM "{parent}" p WHERE {predicates})'
    )
    return int(conn.execute(sql).fetchone()[0])


def audit_connections(actual: sqlite3.Connection,
                      canonical: sqlite3.Connection) -> dict:
    actual_tables = table_names(actual)
    expected_tables = table_names(canonical)
    report = {
        "read_only": True,
        "canonical_tables_missing": sorted(expected_tables - actual_tables),
        "canonical_tables_present": sorted(expected_tables & actual_tables),
        "tables": {},
        "foreign_key_violations": [],
        "orphan_relationships": [],
        "duplicate_unique_groups": [],
        "invalid_check_rows": [],
        "missing_canonical_objects": [],
        "custom_objects": [],
        "errors": [],
    }

    for table in sorted(expected_tables & actual_tables):
        expected_columns = column_signature(canonical, table)
        actual_columns = column_signature(actual, table)
        expected_fks = foreign_keys(canonical, table)
        actual_fks = foreign_keys(actual, table)
        expected_unique = unique_index_signature(canonical, table)
        actual_unique = unique_index_signature(actual, table)
        entry = {
            "columns_match": actual_columns == expected_columns,
            "foreign_keys_match": actual_fks == expected_fks,
            "unique_indexes_match": actual_unique == expected_unique,
            "missing_columns": sorted(set(x[0] for x in expected_columns) -
                                      set(x[0] for x in actual_columns)),
            "unexpected_columns": sorted(set(x[0] for x in actual_columns) -
                                          set(x[0] for x in expected_columns)),
            "expected_foreign_keys": expected_fks,
            "actual_foreign_keys": actual_fks,
            "expected_unique_indexes": expected_unique,
            "actual_unique_indexes": actual_unique,
        }
        report["tables"][table] = entry

        # Detect data that would violate canonical unique indexes before a rebuild.
        for columns, partial in expected_unique:
            if partial or not columns or any(column is None for column in columns):
                continue
            group_sql = ", ".join(f'"{column}"' for column in columns)
            duplicates = rows(
                actual,
                f'SELECT {group_sql}, COUNT(*) FROM "{table}" '
                f'GROUP BY {group_sql} HAVING COUNT(*) > 1 LIMIT 20'
            )
            if duplicates:
                report["duplicate_unique_groups"].append({
                    "table": table, "columns": list(columns),
                    "sample_duplicate_groups": duplicates,
                })

        # Extract simple IN-list CHECK constraints from canonical table DDL.
        # This intentionally does not attempt to interpret arbitrary SQL expressions.
        ddl_row = canonical.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table,)
        ).fetchone()
        ddl = ddl_row[0] if ddl_row else ""
        for check in re.finditer(
            r"CHECK\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s+IN\s*\(([^)]*)\)\s*\)",
            ddl, re.IGNORECASE
        ):
            column = check.group(1)
            allowed = re.findall(r"'((?:''|[^'])*)'", check.group(2))
            if not allowed or column not in {item[0] for item in actual_columns}:
                continue
            placeholders = ", ".join("?" for _ in allowed)
            invalid = rows(
                actual,
                f'SELECT "{column}", COUNT(*) FROM "{table}" '
                f'WHERE "{column}" NOT IN ({placeholders}) GROUP BY "{column}" LIMIT 20',
                tuple(value.replace("''", "'") for value in allowed),
            )
            if invalid:
                report["invalid_check_rows"].append({
                    "table": table, "column": column,
                    "allowed_values": allowed, "invalid_values_and_counts": invalid,
                })

        # Inspect every canonical relationship even when the legacy table has no FK.
        grouped: dict[int, list[tuple]] = {}
        for fk in expected_fks:
            grouped.setdefault(int(fk[0]), []).append(fk)
        for group in grouped.values():
            group.sort(key=lambda item: int(item[1]))
            parent = group[0][2]
            child_cols = [item[3] for item in group]
            parent_cols = [item[4] for item in group]
            if parent not in actual_tables:
                continue
            count = orphan_count(actual, table, parent, child_cols, parent_cols)
            if count:
                report["orphan_relationships"].append({
                    "child_table": table,
                    "parent_table": parent,
                    "child_columns": child_cols,
                    "parent_columns": parent_cols,
                    "orphan_rows": count,
                })

    try:
        report["foreign_key_violations"] = [
            list(row) for row in actual.execute("PRAGMA foreign_key_check").fetchall()
        ]
    except sqlite3.DatabaseError as exc:
        report["errors"].append(f"foreign_key_check: {exc}")

    expected_objects = {
        (r[0], r[1]) for r in rows(
            canonical,
            "SELECT type,name FROM sqlite_master "
            "WHERE type IN ('index','trigger') AND sql IS NOT NULL"
        )
    }
    actual_objects = {
        (r[0], r[1]) for r in rows(
            actual,
            "SELECT type,name FROM sqlite_master "
            "WHERE type IN ('index','trigger') AND sql IS NOT NULL"
        )
    }
    for kind, name in sorted(expected_objects - actual_objects):
        report["missing_canonical_objects"].append({"type": kind, "name": name})
    for kind, name in sorted(actual_objects - expected_objects):
        report["custom_objects"].append({"type": kind, "name": name})

    report["schema_drift"] = bool(
        report["missing_canonical_objects"] or
        report["canonical_tables_missing"]
        or any(not (
            item["columns_match"] and item["foreign_keys_match"]
            and item["unique_indexes_match"]
        ) for item in report["tables"].values())
    )
    report["data_violations"] = bool(
        report["foreign_key_violations"] or report["orphan_relationships"]
        or report["duplicate_unique_groups"] or report["invalid_check_rows"]
    )
    report["safe_to_rebuild"] = not (
        report["schema_drift"] or report["data_violations"] or report["errors"]
    )
    return report


def open_read_only(path: Path) -> sqlite3.Connection:
    absolute = path.resolve()
    uri = f"file:{quote(str(absolute))}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA query_only=ON")
    return conn


def self_test(migration_path: Path) -> None:
    canonical = sqlite3.connect(":memory:")
    canonical.executescript(migration_path.read_text(encoding="utf-8"))

    legacy = sqlite3.connect(":memory:")
    legacy.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            tickets REAL NOT NULL DEFAULT 0,
            verified INTEGER NOT NULL DEFAULT 0,
            banned INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users(id,username,email,password_hash,role)
        VALUES(1,'fixture','fixture@example.invalid','hash','owner');
        INSERT INTO sessions(token_hash,user_id,expires_at)
        VALUES('orphan-session',999,9999999999);
        CREATE INDEX custom_fixture_index ON users(username);
        CREATE TRIGGER custom_fixture_trigger AFTER INSERT ON users
        BEGIN UPDATE users SET verified=1 WHERE id=NEW.id; END;
    """)
    legacy.execute("PRAGMA query_only=ON")
    result = audit_connections(legacy, canonical)
    assert result["schema_drift"], "legacy constraints should be detected"
    assert result["data_violations"], "invalid role/orphan fixture should be blocked"
    assert result["orphan_relationships"], "missing legacy FK must not hide orphan rows"
    assert result["invalid_check_rows"], "invalid role values must be detected explicitly"
    assert {"index", "trigger"} <= {
        item["type"] for item in result["custom_objects"]
    }, "custom indexes and triggers must be inventoried"
    try:
        legacy.execute("INSERT INTO users(username,email,password_hash) VALUES('blocked','blocked@example.invalid','x')")
    except sqlite3.DatabaseError:
        pass
    else:
        raise AssertionError("query_only must prevent writes to the inspected connection")
    print("PASS: schema drift, orphan/CHECK/unique violations, custom objects, and read-only guard")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, help="Path to a local SQLite backup/export (opened read-only)")
    parser.add_argument("--migration", type=Path, default=Path("migrations/0001_initial.sql"))
    parser.add_argument("--self-test", action="store_true", help="Run isolated in-memory regression fixtures")
    args = parser.parse_args()

    if args.self_test:
        self_test(args.migration)
        return 0
    if not args.database:
        parser.error("--database is required unless --self-test is used")
    if not args.database.is_file():
        parser.error("database file does not exist")
    if not args.migration.is_file():
        parser.error("canonical migration file does not exist")

    canonical = sqlite3.connect(":memory:")
    canonical.executescript(args.migration.read_text(encoding="utf-8"))
    actual = open_read_only(args.database)
    try:
        result = audit_connections(actual, canonical)
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0 if result["safe_to_rebuild"] else 2
    finally:
        actual.close()
        canonical.close()


if __name__ == "__main__":
    sys.exit(main())
