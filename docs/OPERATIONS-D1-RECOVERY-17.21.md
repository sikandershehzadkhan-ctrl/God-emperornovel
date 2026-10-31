# Production D1 recovery readiness

**Target:** `god-emperornovel-db`  
**Policy:** zero additional spend, no production restore without explicit authorization.

## Recovery layers

### 1. Cloudflare D1 Time Travel

Cloudflare documents Time Travel as always enabled, with no additional charge for database history or restores. On the Workers Free plan, the documented recovery window is **7 days** (the Workers Paid plan documents 30 days). Imperial Novel must not upgrade or incur charges to use this feature.

Read the current recovery bookmark:

```sh
npx wrangler@4 d1 time-travel info god-emperornovel-db
```

Inspect the database backend before relying on Time Travel:

```sh
npx wrangler@4 d1 info god-emperornovel-db
```

The database must report the production backend. The repository's read-only production audit workflow checks that Time Travel can return a current bookmark. This is a capability check, **not** a restore rehearsal.

### 2. Optional SQL export

For an independently held copy, Cloudflare documents:

```sh
BACKUP="$HOME/imperial-novel-private-backups/imperial-novel-d1-$(date -u +%Y%m%dT%H%M%SZ).sql"
mkdir -p "$(dirname "$BACKUP")"
npx --yes wrangler@4 d1 export god-emperornovel-db --remote --output="$BACKUP"
test -s "$BACKUP"
wc -c "$BACKUP"
sha256sum "$BACKUP"
```

The export contains production data, potentially including personal information. Never commit it to this public repository, attach it to a public issue/PR, or print its contents in CI logs. Store it only in encrypted private storage with access restricted to the owner. Record the UTC timestamp, file size, checksum, Wrangler version and restore-test result in a private operations log. Keep a second encrypted copy in a separate owner-controlled location if one is available. If safe private storage is unavailable, do not create or upload a copy merely to tick a checklist.

Do not treat a non-empty file as a verified backup by itself. Verify the export command's exit status, checksum and ability to import into a separate empty disposable database before calling the backup restore-tested. Do not import into the live database as a test.

To import an export, use a **new empty D1 database**, not the live production database:

```sh
npx wrangler@4 d1 execute <NEW_EMPTY_DATABASE> --remote --file=./imperial-novel-production-backup.sql
```

Validate the restored database's tables and critical row counts before any application is pointed at it. A SQL export/import rehearsal has not yet been performed for Imperial Novel.

## Emergency point-in-time restore

**This is destructive. It overwrites the current database state and cancels in-flight queries. Do not automate it in CI or run it as part of deployment.**

1. Stop/hold production writes and deployment activity.
2. Record the current bookmark and the incident time in UTC:
   `npx wrangler@4 d1 time-travel info god-emperornovel-db`
3. Ask the owner to explicitly approve the exact restore timestamp/bookmark.
4. Restore only the approved point:
   `npx wrangler@4 d1 time-travel restore god-emperornovel-db --bookmark=<APPROVED_BOOKMARK>`
5. Preserve the command's returned previous bookmark. Cloudflare documents that this can be used to undo the restore.
6. Re-run read-only schema/table checks, health checks and critical user/accounting invariants before reopening writes.
7. Do not assume a restore is successful merely because the CLI exits zero. Verify application behaviour and record the recovery result.

## Release gate

- Read-only audit can retrieve a current Time Travel bookmark.
- Production database identity matches `wrangler.toml`.
- Destructive restore remains manual and requires explicit approval.
- No production schema/financial migration is released while backup/recovery status is unknown.
- No production restore rehearsal has been claimed until one is actually performed and independently verified.

## Official Cloudflare references

- [D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [D1 import and export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
