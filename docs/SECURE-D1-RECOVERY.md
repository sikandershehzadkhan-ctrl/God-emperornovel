# Secure D1 Backup, Recovery, and Financial Reconciliation

This runbook is for the Imperial Novel D1 database. It is an operational guide, not evidence that a backup has been exported or a restore has been rehearsed. Never run a destructive production restore as a test.

## Database identity

- Wrangler database name: `god-emperornovel-db`
- Binding: `DB`
- Database ID: configured in `wrangler.toml`
- Runtime: Cloudflare Workers + D1

Before any operation, confirm the account, database name, database ID, environment, and target. Do not paste API tokens, exported SQL, session tokens, password hashes, or payment evidence into GitHub issues, public repositories, or chat.

## Recovery layers

### 1. Cloudflare D1 Time Travel

Cloudflare documents D1 Time Travel as always enabled. It restores a database to a prior point in time without a separately configured backup schedule. Retention depends on the Cloudflare plan: the current documentation states 7 days on Workers Free and 30 days on Workers Paid. Verify the actual account plan and current D1 limits before relying on a retention window.

Inspect the current bookmark:

```bash
npx wrangler d1 time-travel info god-emperornovel-db
```

Inspect the bookmark for a specific UTC timestamp:

```bash
npx wrangler d1 time-travel info god-emperornovel-db --timestamp="2026-11-01T12:00:00Z"
```

A restore is destructive. It overwrites the target database and cancels in-flight queries and transactions. It is not a routine rollback button.

**Production restore checklist**

1. Declare an incident and stop further deployments or schema changes.
2. Pause or disable write-producing application operations using a reviewed operational procedure. Do not improvise by editing production data.
3. Capture the current bookmark and record the incident time in UTC.
4. Identify the last known-good timestamp. Confirm the affected period and expected data loss with the incident owner.
5. Review the exact target database and timestamp twice. Obtain explicit production restore approval.
6. Restore only after approval:

   ```bash
   npx wrangler d1 time-travel restore god-emperornovel-db --timestamp="YYYY-MM-DDTHH:MM:SSZ"
   ```

7. Record the bookmark returned by the restore. Cloudflare documents that it can be used to undo the restore if necessary.
8. Verify schema/migration state, account access, novel/chapter ownership, ticket balances, ticket ledger, donations, request refunds, and audit history before reopening writes.
9. Keep the incident record and the before/after bookmarks.

Do not test this command against production. Use a separate disposable D1 database for rehearsals and verify that the test target is not the production database.

### 2. Manual SQL export

For an independent copy that can be retained beyond Time Travel's window, Cloudflare documents:

```bash
npx wrangler d1 export god-emperornovel-db --remote --output=./imperial-novel-d1-export.sql
```

A full export contains sensitive personal and account data. Treat it as a high-sensitivity credential-equivalent artifact:

- Export only from a trusted device and network.
- Encrypt the file before copying it to another storage location.
- Store it only in private, access-restricted storage with MFA where available.
- Never commit it to this repository, attach it to a public issue, or upload it to an untrusted service.
- Keep a dated inventory entry, file size, checksum, encryption method, and authorized custodian. Store the checksum separately from the encrypted backup.
- Delete temporary plaintext copies after verifying the encrypted copy.
- Set a retention and deletion schedule appropriate to legal and operational needs.

Cloudflare notes that an export blocks other database requests while it runs. Schedule it during a low-traffic period and do not assume it is impact-free.

### 3. Restore rehearsal using an isolated database

A rehearsal must never point at `god-emperornovel-db`.

1. Create a disposable D1 database in the same Cloudflare account, with a clearly distinct name such as `imperial-novel-recovery-test`.
2. Export the production database only through an approved secure process.
3. Import the encrypted export only after decrypting it on a trusted device, and only into the disposable target:

   ```bash
   npx wrangler d1 execute imperial-novel-recovery-test --remote --file=./imperial-novel-d1-export.sql
   ```

4. Validate schema, row counts, foreign-key integrity, account isolation, ticket ledger, donations, and audit records against the export's recorded manifest.
5. Do not connect the test database to the public Worker or real users.
6. Delete the disposable database and securely remove temporary files when the rehearsal is complete.

If an export contains data that should not be copied into a rehearsal, use a separately prepared sanitized dataset instead.

## Financial reconciliation

The `users.tickets` balance is the current account balance. `ticket_ledger` records subsequent movements. Do not assume the sum of ledger deltas equals a user's current balance unless an opening-balance baseline has been recorded and reconciled.

Core review queries (run read-only against an approved environment):

```sql
SELECT
  u.id,
  u.username,
  u.tickets AS current_crowns,
  COALESCE(SUM(l.delta), 0) AS recorded_ledger_delta,
  COUNT(l.id) AS ledger_entries
FROM users u
LEFT JOIN ticket_ledger l ON l.user_id = u.id
GROUP BY u.id, u.username, u.tickets
ORDER BY u.id;
```

```sql
SELECT reason, COUNT(*) AS entries, SUM(delta) AS net_delta
FROM ticket_ledger
GROUP BY reason
ORDER BY reason;
```

```sql
SELECT user_id, reference, reason, COUNT(*) AS duplicate_count
FROM ticket_ledger
WHERE reference IS NOT NULL AND reference <> ''
GROUP BY user_id, reference, reason
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

Investigate every unexpected duplicate, unexplained balance change, missing reference, or mismatch with a known opening balance. A duplicate reference is a review signal, not proof of fraud: some older ledger paths may have used different reference conventions.

Financial events to cross-check include:

- Chapter and batch unlocks: debit, unlock record, ledger entry, and audit event.
- Novel requests: request record, any debit, stable request-ID ledger reference, and audit event.
- Donation approvals: pending-to-approved transition, user credit, ledger entry, and administrator audit event.
- Donation rejections: pending-to-rejected transition and administrator audit event; no Crown credit should be created.
- Novel-request refunds: request state transition, refund credit, stable request-ID ledger reference, and administrator audit event.
- Administrator credits: idempotency reference, one ledger entry, one balance mutation, and audit event.

Never manually edit `users.tickets` to "fix" a discrepancy. Record the incident, establish the cause, and use a reviewed, idempotent correction path that creates a matching ledger entry and audit event.

## Release and ownership rules

- CI validation is not a backup, and a successful deployment is not a recovery rehearsal.
- Do not run remote migrations, exports, or restores as part of ordinary feature development.
- Production restore, data export, and account/payment-data access require explicit authorization from the project owner.
- Review Cloudflare's current documentation before each recovery operation:
  - https://developers.cloudflare.com/d1/reference/time-travel/
  - https://developers.cloudflare.com/d1/wrangler-commands/
  - https://developers.cloudflare.com/d1/best-practices/import-export-data/

## Current verified state

This document adds procedures only. No production export, restore, remote SQL query, or backup rehearsal was run while writing it. The repository's CI uses isolated local D1 for tests and does not establish that an offsite backup exists or that production recovery has been rehearsed.
