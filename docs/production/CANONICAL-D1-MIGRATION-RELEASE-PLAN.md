# Canonical production D1 migration release plan

STATUS: BLOCKED

## Why production release is blocked

The development integration now has one canonical migration chain, 0001–0046. The production deployment workflow previously referenced branch-local files named `0012_chapter_revisions.sql` and `0013_scheduled_chapter_publications.sql`. Those names are no longer valid in the canonical chain: profile/account migrations own 0012–0015, and chapter revisions/scheduling are 0016–0017.

The production D1 database's exact applied migration history has not been inspected and reconciled in this work session. A source-tree replay against fresh SQLite is not evidence of the remote D1 state.

The workflow is therefore mechanically disabled at the deploy-job condition (`if: ${{ false }}`), in addition to its manual confirmation input and migration safety checks. Even a manually dispatched run with `confirm_production_deploy=true` cannot execute production commands. Do not remove that condition merely to deploy the new Worker.

## D1 recovery point procedure

Cloudflare D1 Time Travel is always enabled for databases on the production storage backend. Cloudflare's current documentation states that it retains up to 7 days on the Workers Free plan and up to 30 days on paid plans, with no additional charge for history or restoring. This is a short-window recovery mechanism, not a substitute for a long-term encrypted export.

Before any approved production schema mutation:

1. Run `npx wrangler@4 d1 info god-emperornovel-db` and confirm the database reports `version: production`. If it reports another backend, stop and review the applicable backup mechanism.
2. Run `npx wrangler@4 d1 time-travel info god-emperornovel-db` and record the current timestamp and bookmark in the restricted release record before the first write.
3. Confirm the bookmark is returned successfully. Do not treat a fresh SQLite replay or a bookmark lookup as proof that a restore has been rehearsed.
4. Keep the bookmark available for the full migration and observation window. If a restore is required, an authorized operator must review the exact target bookmark and manually run `npx wrangler@4 d1 time-travel restore god-emperornovel-db --bookmark=<RECORDED_BOOKMARK>`.
5. Treat restore as a break-glass operation: it overwrites the database state and cancels in-flight queries. Never invoke it automatically from a failed deployment job. Record the previous bookmark returned by the restore so the restore itself can be undone if necessary.
6. Do not upload raw production D1 exports to ordinary repository artifacts or logs. Any long-term export must be encrypted and stored in a private location with restricted access.

Official references: [D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/) and [Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/).


## Canonical migration chain

- 0001–0011: existing platform foundation and author application base.
- 0012: user profiles.
- 0013: username change cooldown/history.
- 0014: account preferences.
- 0015: historical username insert guard.
- 0016: chapter revisions.
- 0017: scheduled chapter publications.
- 0018–0027: media, rights, comics, quotas, donation review, ticket adjustments and novel-request refunds.
- 0028: community/runtime integrity reconciliation.
- 0029: chapter update timestamps.
- 0030: daily view analytics.
- 0031: account closure requests.
- 0032: Author Studio writing goals.
- 0033: private creator notes.
- 0034: fresh-install legacy ratings baseline.
- 0035: one-time 1–5 to 1–10 rating conversion and aggregate recomputation in `migrations/0035_ten_point_ratings.sql`.
- 0036: single-use, purpose-bound password reset tokens stored as hashes.
- 0037: mailbox ownership verification, separate from the existing creator/admin verification badge.
- 0038: password-reset token mailbox snapshot binding.
- 0039: consent-based novel ownership transfer with guarded acceptance and immutable transfer history.
- 0040: canonical account-closure request table rebuild, preserving request and review metadata while enforcing the governed status set.
- 0041: account-deletion review cases, versioned claims, and append-only review events. This stores review state only; it does not execute deletion.
- 0042: explicit account-deletion reviewer role assignments and append-only assignment/revocation audit.
- 0043: immutable, version-bound account-deletion disposition plans and items.
- 0044: independent immutable approval bound to the exact disposition-plan digest.
- 0045: specialist-scoped immutable account-deletion findings and corresponding audit events.
- 0046: token-fenced AI Author Studio run-claim columns and lookup index.

## Required work before a production release

1. Confirm the production D1 storage backend supports Time Travel and capture a current recovery bookmark using the procedure above. Rehearse restore on a disposable production-shaped copy when one is available; do not test restore against the live database.
2. After the audit workflow is available on the default branch, manually run GitHub Actions workflow "Imperial Novel Read-Only Production D1 Audit". It checks the database identity and Time Travel bookmark, reports the schema marker and migration ledger, inventories schema definitions, and checks foreign-key integrity. It is strictly read-only; retain its run URL and summary as the evidence record. If the Cloudflare secrets are unavailable, do not copy credentials into chat or commit them; an authorized owner must configure the repository secrets.
3. Inspect the remote D1 schema marker, tables, columns, indexes, triggers, foreign keys and any existing migration ledger using the audit report and read-only queries.
3. Compare the actual remote schema against each canonical migration. Determine which changes were previously applied manually, through runtime bootstrap, or by earlier deployment workflows.
4. Build a signed-off applied-migration ledger with the exact canonical filename and SHA-256 checksum for every migration already represented in production. Never infer that a migration ran merely because a similarly named table exists.
5. Rehearse the remaining migration plan against a production-shaped disposable SQLite/D1 copy, including legacy profile/account data, existing chapter revisions, media/comic references, community records, tickets/donations, private author data, existing ratings, password-reset and email-verification records, ownership transfers, account-closure requests/review metadata, and AI Author Studio jobs.
6. Pay special attention to data-rebuilding migrations 0035 and 0040. For 0035, verify the existing ratings table constraint and data, preserve timestamps, map old scores 1–5 to 2/4/6/8/10, recompute novel averages, and prove the operation is applied exactly once. For 0040, verify every existing account-closure request and review field is preserved, unknown statuses are handled as specified, and required indexes are recreated.
7. Review the security boundaries introduced by 0036–0046 in the rehearsal: token hashes only and purpose/expiry/consumption guards; mailbox snapshot binding; consent and eligibility checks on ownership transfer; separation of account-deletion review from deletion execution; reviewer role and independent approval constraints; immutable audit/disposition records; and token-fenced AI run claims.
8. Only after review, implement a ledger-aware runner that applies only verified missing migrations, records checksums transactionally where possible, stops on any mismatch, and verifies post-migration schema.
9. Re-enable production deployment in a separate reviewed change with explicit approval. Deploy only after the D1 migration step and Worker dry-run both pass.

## Required post-migration schema checks

At minimum, the reviewed release runner must verify these structures before deploying the Worker:

- `idx_chapter_revisions_chapter_created` and `idx_scheduled_chapter_publications_due`.
- `author_story_goals` and `idx_author_story_goals_owner_updated`.
- `author_private_notes`, `idx_author_private_notes_owner_story_updated` and `idx_author_private_notes_chapter`.
- The ten-point `ratings` CHECK constraint and recomputed novel rating aggregates.
- `password_reset_tokens` with unique token hashes and active-token indexes; `email_verification_tokens` with its separate `users.email_verified_at` field and active-token indexes; and `password_reset_tokens.email_snapshot`.
- `novel_ownership_transfers`, its pending-transfer uniqueness constraint, recipient/owner/history/expiry indexes, and guarded acceptance/immutability triggers.
- `account_closure_requests` with its pending-per-user and status/grace indexes.
- `account_deletion_reviews`, `account_deletion_review_events`, `account_deletion_reviewer_assignments`, `account_deletion_reviewer_assignment_events`, `account_deletion_disposition_plans`, `account_deletion_disposition_items`, `account_deletion_disposition_approvals`, and `account_deletion_disposition_findings`; verify their foreign keys, uniqueness constraints, reviewer/scope guards, version/digest checks, and append-only audit/immutability triggers.
- `ai_author_projects.active_run_token`, `ai_author_projects.active_run_started_at`, `ai_author_projects.active_run_owner_user_id`, `ai_chapter_jobs.run_token`, and `idx_ai_chapter_jobs_run_token`.
- `PRAGMA integrity_check` and `PRAGMA foreign_key_check` on the rehearsal database.

## Current safety state

- Production D1 migration: not performed.
- Production Worker deployment: not performed.
- Remote migration ledger: not verified.
- Existing deployment workflow: hard-disabled in `.github/workflows/deploy.yml`.
- Fresh SQLite migration replay: validated in Cloudflare Source Validation, but it does not replace the remote audit above.
- Migrations 0036–0046: present in the development integration only; their presence and successful fresh-database replay do not establish that they have been applied to production D1.

## Required integration CI evidence

Before this pull request is considered ready for review, its current head must have fresh successful pull-request checks for both **Imperial Novel Cloudflare Source Validation** and **Graphify architecture map**. Confirm the checks belong to the exact current head SHA, not an earlier commit. A mergeable GitHub status and a successful fresh-SQLite replay are not substitutes for those checks. If either workflow is skipped or does not start, treat validation as pending and investigate the workflow trigger; do not mark this release plan complete.
