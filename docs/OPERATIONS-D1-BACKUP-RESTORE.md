# Imperial Novel D1 Backup and Restore Runbook

Status: operator procedure, not evidence that a production backup has been taken.

Database: `god-emperornovel-db`  
Worker: `god-emperornovel`

## Safety rules

- Never commit database exports, user data, payment records, credentials, or backups to this repository.
- Treat an export as sensitive personal and financial data. Store it only in an access-controlled, encrypted location.
- Do not run a production export during peak traffic. Cloudflare documents that a running D1 export blocks other database requests.
- Do not test restoration by overwriting production.
- Do not enable a paid Cloudflare plan, paid backup vendor, or paid automation for this procedure.
- A command being documented is not proof that a backup exists. Record the date, file size, checksum, operator, and restore-test result separately.

## 1. Preflight

Use a trusted environment with the repository's pinned Wrangler version and Cloudflare authentication for the correct account.

Confirm the target database and binding before running any remote command:

```sh
npx wrangler d1 list
```

Confirm the production database name in `wrangler.toml` and verify the account/environment. Never paste API tokens into chat or commit them.

## 2. Export a production snapshot

Choose a quiet maintenance window. Create a private local backup directory outside the repository if possible:

```sh
mkdir -p "$HOME/imperial-novel-private-backups"
BACKUP="$HOME/imperial-novel-private-backups/imperial-novel-d1-$(date -u +%Y%m%dT%H%M%SZ).sql"
npx wrangler d1 export god-emperornovel-db --remote --output="$BACKUP"
```

Confirm the file exists and is non-empty:

```sh
test -s "$BACKUP" && wc -c "$BACKUP" && sha256sum "$BACKUP"
```

Record the checksum and file size in a private operations log, not in a public issue or commit. Copy the export to encrypted storage. Keep at least two independently stored copies if available. Never upload the SQL dump to GitHub.

If export fails, stop. Do not treat a partial file as a valid backup.

## 3. Restore rehearsal using a local database

A restore rehearsal must not target the production database. Wrangler's local D1 database is separate from the remote D1 database:

```sh
npx wrangler d1 execute god-emperornovel-db --local --file="$BACKUP"
```

Then inspect the restored schema and representative row counts locally. Example:

```sh
npx wrangler d1 execute god-emperornovel-db --local --command "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
```

Compare important table counts against a separately recorded pre-export inventory. At minimum inspect users, novels, chapters, donations, ticket_ledger, unlocks, and connectors. Never publish those row contents.

A local restore rehearsal validates that the export can be imported into the local SQLite/D1-compatible environment. It does **not** prove that a remote production restore will succeed or that every Cloudflare-specific behavior is identical.

## 4. Production recovery is a controlled incident

A production restore is not a routine command. Before any remote import:

1. Confirm the incident, affected database, recovery point and expected data loss with the project owner.
2. Preserve a fresh export of the current production state if the database is still accessible.
3. Verify the chosen backup checksum and successful local restore rehearsal.
4. Review the SQL dump for transaction wrappers and D1 import compatibility. Cloudflare's import guidance says to remove `BEGIN TRANSACTION` and `COMMIT` from SQLite dumps when they cause nested-transaction errors.
5. Plan for duplicate rows, schema drift, foreign keys, and data created after the backup.
6. Prefer restoring into a separate disposable database first. Only use a remote production import after a separately approved recovery plan, and only when the target state is understood.

The documented import command is:

```sh
npx wrangler d1 execute <database_name> --remote --file=<backup.sql>
```

This command is intentionally shown with placeholders. It is **not** an instruction to import over the live database. Importing a full dump into a populated database may fail or create conflicts. Do not run it against `god-emperornovel-db` without a verified incident-specific plan and explicit owner authorization.

## 5. Backup evidence checklist

For every real backup, record privately:

- UTC timestamp and operator
- Cloudflare account/environment and database name
- Wrangler version
- Export command result and exit status
- File size and SHA-256 checksum
- Encrypted storage locations
- Local restore rehearsal date and result
- Tables/counts checked (counts only, no personal data)
- Known limitations and next backup due date

## Official Cloudflare references

- [D1 import and export data](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/)

## Current project status

No production export, encrypted off-device copy, or restore rehearsal is claimed by this document. Those remain release gates for financial and schema-changing production work.
