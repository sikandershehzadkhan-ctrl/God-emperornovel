# Imperial Novel D1 backup and recovery runbook

## Current recovery layer

The production database is Cloudflare D1, configured as `god-emperornovel-db` in `wrangler.toml`.

Cloudflare D1 Time Travel is enabled automatically for supported production-storage databases. Cloudflare's current documentation states:
- Workers Free: point-in-time recovery within the previous 7 days.
- Workers Paid: point-in-time recovery within the previous 30 days.
- Bookmarks are automatic; a scheduled backup job is not required for Time Travel.
- A successful `wrangler d1 time-travel info` check proves that Cloudflare returned recovery metadata. It does not prove that a restore has been rehearsed.

Official references:
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/d1/wrangler-commands/

Confirm the actual account plan and database storage subsystem before relying on a retention window. Do not assume a 30-day window on the Free plan.

## Recovery safety rules

1. Never run a restore as part of normal CI, a cron trigger, or a deployment.
2. A restore rewinds production data. Require explicit owner approval and a documented incident reason.
3. Before restoring, stop or otherwise coordinate writes to the affected database so new user activity is not unexpectedly lost.
4. Record the selected UTC timestamp and the current bookmark.
5. Export the current database to a secure, access-controlled location before a restore. Do not commit SQL exports, upload them as public artifacts, or place user data in ordinary CI logs.
6. Confirm that the selected point is inside the account's retention window.
7. Restore only after verifying the exact database name and account identity.
8. After restore, run read-only schema, health, and critical aggregate checks before reopening writes.
9. Record the outcome without copying personal data, chapter text, credentials, or raw database exports into the report.

## Read-only inspection

From an authenticated, trusted environment with Wrangler v4 and a narrowly scoped Cloudflare API token:

```sh
npx wrangler@4 d1 time-travel info god-emperornovel-db
```

This reads recovery metadata. It does not restore the database.

## Export before a recovery operation

Cloudflare documents remote SQL export:

```sh
npx wrangler@4 d1 export god-emperornovel-db --remote --output=./imperial-novel-pre-restore.sql
```

Treat the output as highly sensitive: it may contain account records, private content, session-related data, and other user information. Store it only in an encrypted, private location with access limited to the owner. Never commit it to this repository or expose it in CI artifacts/logs.

Cloudflare documents export limitations for virtual tables. Check the current D1 export documentation and actual schema before treating a SQL export as a complete backup.

## Restore command: deliberately manual and destructive

Do not execute this command without explicit incident approval, a verified timestamp/bookmark, a current export, and a write-freeze plan.

```sh
npx wrangler@4 d1 time-travel restore god-emperornovel-db --timestamp="YYYY-MM-DDTHH:MM:SSZ"
```

Alternatively, use a verified bookmark with `--bookmark=...`. Wrangler's confirmation prompt is an additional safety check, not a substitute for owner approval.

## Post-restore verification

At minimum:
- Confirm the Worker health endpoint reports healthy database connectivity.
- Run the existing read-only production D1 audit and production schema preflight.
- Verify schema version and required tables/columns/indexes.
- Compare safe aggregate counts against the incident baseline where available.
- Verify login/session behavior and critical read/write flows using controlled test accounts.
- Confirm the deployed Worker version is compatible with the restored schema before reopening normal traffic.

## Known gap and next action

The repository currently checks for a Time Travel bookmark but does not perform a restore rehearsal or maintain an independently verified off-platform backup. A rehearsal must use a separate non-production D1 database, not the live production database. Provisioning and testing that separate database requires owner-approved Cloudflare access and must not be assumed complete.

No production database, Worker, account setting, or backup was changed by creating this runbook.
