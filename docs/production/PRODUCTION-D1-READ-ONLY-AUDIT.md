# Production D1 read-only audit procedure

STATUS: EVIDENCE COLLECTION ONLY. Production migrations and Worker deployment remain blocked.

## Purpose

Collect a reproducible snapshot of the live D1 schema before designing or running any migration. This audit does not apply migrations, create a ledger, alter settings, or deploy a Worker.

## Preconditions

1. The operator must have explicit authorization to inspect the production Cloudflare account and D1 database.
2. Use a trusted environment with Wrangler 4 already authenticated to the intended Cloudflare account. Do not paste API tokens into chat, source files, command history, or screenshots.
3. Confirm the account and database identity before running the query. The intended database name is `god-emperornovel-db`.
4. Do not run this audit concurrently with a deployment or database maintenance operation.
5. Preserve the raw output as a restricted production artifact. It may contain internal schema names and should not be published publicly.

## Run the read-only inventory

From the repository root, run:

```sh
npx --yes wrangler@4 d1 execute god-emperornovel-db --remote --file=docs/production/production-d1-read-only-audit.sql
```

The SQL file contains only SELECT statements against SQLite schema metadata and the read-only foreign-key-check table-valued pragma. It inventories tables, indexes, triggers, views, table metadata, foreign-key violations, and possible migration-ledger tables.

If the inventory confirms that `app_settings` exists, run this separate read-only query to retrieve the current marker:

```sh
npx --yes wrangler@4 d1 execute god-emperornovel-db --remote --command "SELECT key, value FROM app_settings WHERE key = 'core_schema_version' LIMIT 1;"
```

If the table does not exist, do not run the marker query. Record the marker as absent.

## Evidence to preserve

Record all of the following with the audit output:

- UTC timestamp and the exact Git commit whose migration files are being reconciled.
- Cloudflare account identity and D1 database name/ID, without recording credentials.
- Complete command output, including warnings and errors.
- Whether the schema marker exists and its exact value.
- Any existing migration ledger table and all its rows, if one is discovered. Inspect it using a separate SELECT-only query after confirming its exact table and column names from the inventory.
- Any foreign-key violations returned by the audit.

Do not infer migration application from table names alone. A table may have been created by runtime bootstrap, an earlier branch, or a manual operation. A migration is considered represented only after its exact effects and data semantics have been reconciled against the canonical SQL and the production evidence.

## What this audit deliberately does not do

- It does not export or back up production data. A separate recoverable backup and restore rehearsal are mandatory.
- It does not execute `migrations/*.sql`.
- It does not create or populate a migration ledger.
- It does not attempt to repair foreign-key violations.
- It does not prove that a migration ran exactly once.
- It does not validate application authorization or row ownership.
- It does not deploy the Worker.

## Next gate

After collecting the evidence, compare the remote schema and any ledger against every canonical migration 0001–0046, including checksums and data-preservation requirements. Rehearse the remaining sequence against a production-shaped disposable database. In particular, migrations 0035 and 0040 rebuild tables and must be proven safe against representative production data.

Only after a recoverable backup has been restored successfully, the migration ledger has been reconciled, and the rehearsal plus post-migration assertions pass may a separate reviewed change propose a production migration runner. The deployment workflow must remain disabled until that review is complete.

## Safety status

- Remote audit executed in this development task: **No**. No Cloudflare production credentials or remote D1 query result were available.
- Production D1 mutated: **No**.
- Worker deployed: **No**.
- Deployment workflow re-enabled: **No**.
