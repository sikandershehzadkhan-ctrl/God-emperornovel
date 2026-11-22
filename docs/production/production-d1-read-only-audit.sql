-- READ-ONLY PRODUCTION D1 INVENTORY
-- Run only with Wrangler against god-emperornovel-db --remote.
-- Every statement below is SELECT-only. No schema or row mutation is performed.
-- Capture the complete output, timestamp, account/database identity, and operator.

SELECT 'schema_objects' AS audit_section, type, name, tbl_name, sql
FROM sqlite_schema
WHERE name NOT LIKE 'sqlite_%'
ORDER BY CASE type WHEN 'table' THEN 1 WHEN 'index' THEN 2 WHEN 'trigger' THEN 3 WHEN 'view' THEN 4 ELSE 5 END, name;

SELECT 'table_inventory' AS audit_section, schema, name, type, ncol, wr, strict
FROM pragma_table_list
WHERE schema = 'main'
ORDER BY name;

SELECT 'foreign_key_violations' AS audit_section, *
FROM pragma_foreign_key_check;

-- Candidate historical migration-ledger tables. Their existence is evidence
-- to inspect, not proof that any particular canonical migration was applied.
SELECT 'migration_ledger_candidates' AS audit_section, name, sql
FROM sqlite_schema
WHERE type = 'table'
  AND (lower(name) LIKE '%migration%'
       OR lower(name) LIKE '%schema_version%'
       OR lower(name) LIKE '%drizzle%')
ORDER BY name;

-- The schema marker table definition is safe to inspect even if the table is absent.
SELECT 'schema_marker_table' AS audit_section, name, sql
FROM sqlite_schema
WHERE type = 'table' AND name = 'app_settings';

-- Run this final query separately only if app_settings exists:
-- SELECT key, value FROM app_settings WHERE key = 'core_schema_version';
