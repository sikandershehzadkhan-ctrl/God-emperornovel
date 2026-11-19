# Canonical D1 migration risk register and release evidence

STATUS: DESIGN / REVIEW CHECKLIST ONLY. This document does not authorize or execute production migrations.

## Scope and source baseline

This register covers the canonical migration sequence `0001–0046` on the `integration/ratings-10-on-canonical-migrations-2026-11-16` lineage, as inspected on 2026-11-19. The release-gate branch adds a fail-closed check for the complete sequence and reservation records. A filename, reservation, fresh-database test, or matching table is not proof that a migration has been applied to production.

The first-pass SQL classification below is based on the checked-in migration names and statement patterns. It is a review index, not a substitute for reading each complete migration and its dependent Worker queries before release.

## First-pass risk groups

| Migration(s) | Area | Risk / required review |
| --- | --- | --- |
| 0001–0011 | Initial schema, publishing, rights, AI Author Studio, discovery, catalog indexes, author applications | Establish the actual production baseline first. These files cannot be replayed blindly against a live database. Confirm which structures were created by historical runtime bootstrap versus migrations. |
| 0012–0014 | User profile and preference columns | Additive user-row changes. Verify existing column absence, defaults, row counts, and compatibility with current application reads/writes before applying. |
| 0015 | Historical username insert guard | Trigger/policy change. Test both allowed new usernames and rejected historical-name reuse; inspect any existing trigger with the same purpose. |
| 0016–0018 | Chapter revisions, scheduled publication, media asset registry | New data structures and indexes. Verify foreign-key targets, ownership constraints, and that media metadata does not imply storage objects or publication approval exist. |
| 0019–0023 | Media publication/rights gates, comic asset ownership, review audit, quotas, draft-only comic pages | Trigger and data-policy changes. Test permitted and rejected transitions, ownership isolation, quota accounting, and existing asset states. Never infer that an R2 bucket or upload pipeline exists from D1 metadata. |
| 0024–0027 | Donation review, administrator ticket adjustments, independent review, novel-request refunds | Financial/audit-sensitive records. Verify idempotency keys, immutable decision history, actor attribution, no self-approval, and exactly-once refund/credit invariants with duplicate/retry tests. |
| 0028 | Runtime feature integrity | Inspect every statement and existing runtime-created object for collision or duplicate-object risk. Prove fresh-install and upgrade paths separately. |
| 0029 | Chapter update timestamps | Adds a chapter column and index. Validate backfill semantics, null handling, update triggers/application writes, and query compatibility. |
| 0030 | Daily view analytics | New aggregate table/indexes. Confirm aggregation uniqueness and ensure no reader identity or personal reading history is introduced. |
| 0031 | Account closure requests | New lifecycle table and indexes. Verify that this is a reversible request/review record only and does not execute erasure. |
| 0032–0033 | Author story goals and private notes | Owner-scoped private data. Test cross-user read/write denial and optional chapter ownership references. |
| 0034 | Ratings baseline | Compatibility bridge for the ratings table. Confirm production legacy shape before relying on this baseline. |
| **0035** | **1–10 rating table rebuild** | **HIGH RISK: creates a replacement table, copies historical ratings with 1–5 mapped to even values 2–10, drops the old table, renames the replacement, and recomputes novel averages. Requires pre/post row counts, per-rating mapping checks, duplicate/constraint checks, average reconciliation, foreign-key/index/trigger inspection, and restore rehearsal.** |
| 0036–0038 | Password reset tokens and email verification hardening | Authentication-sensitive additions. Verify token digests only, single-use/purpose fencing, mailbox snapshot behavior, expiry/revocation, and that legacy rows cannot bypass the new checks. |
| 0039 | Novel ownership transfers | Ownership/security-sensitive workflow. Test consent, actor attribution, parent deletion restrictions, pending/accepted/rejected transitions, and that creating a request never changes ownership. |
| **0040** | **Account deletion request table rebuild** | **HIGH RISK: copies and normalizes statuses while dropping and replacing the prior table. Requires exact before/after preservation of IDs, users, timestamps, grace periods, cancellation/completion metadata, review reason, and row counts. Unknown statuses are converted to `review_required`, so enumerate and approve every affected status before any production run. Validate the partial unique index and foreign-key behavior.** |
| 0041–0045 | Account deletion review store, reviewer roles, disposition plans/approvals, specialist findings | Sensitive governance/audit records. Confirm append-only/version-bound semantics, independent reviewer authorization, role separation, plan digest binding, and that these migrations do not enable account erasure. Test duplicate submissions and cross-case access. |
| 0046 | Atomic AI run claims | Adds token-fencing columns and index. Test concurrent claims, stale-token rejection, lease recovery, and compatibility with existing AI Author Studio rows and runtime bootstrap behavior. |

## Mandatory preflight evidence

Before a production migration runner can be proposed, collect and retain:

1. A read-only production D1 inventory and exact `core_schema_version` marker, if present.
2. Exact production database identity and UTC capture time. Never store API tokens or credentials in evidence.
3. Complete table, column, index, trigger, view, and foreign-key inventory.
4. Existing migration-ledger schema and rows, if any. Do not create a ledger or backfill it from guesses.
5. Canonical SQL SHA-256 for every migration file and the matching reservation metadata for 0012–0046.
6. Per-table row counts and targeted integrity summaries for all tables touched by the pending migrations, with privacy-sensitive values excluded from ordinary logs.
7. A verified backup artifact and a successful restore into a separate disposable D1 database. A successful export alone is not a restore test.

## Mandatory rehearsal

Use a disposable database populated with a sanitized, production-shaped fixture. It must include representative edge cases, not just empty tables:

- Existing users, novels, chapters, ratings, creator applications, media assets, donation decisions, ticket adjustments, refunds, account-closure requests, reviewer records, and AI author projects.
- Historical 1–5 ratings including each possible score, duplicate-attempt scenarios, orphan/reference edge cases, and novels with zero ratings.
- Every currently observed account-closure status, including any unrecognized status values, plus cancelled/completed records and boundary timestamps.
- Pending and completed ownership transfers, media rights states, quota states, and concurrent/stale AI run claims.

Run the entire candidate sequence from the verified baseline in strict numeric order. Capture per-migration preflight, execution result, and postflight. Stop on the first mismatch. Do not continue after a partially applied or ambiguous migration until the disposable database has been restored and the failure understood.

## Required postflight assertions

- Expected tables, columns, indexes, and triggers exist with the reviewed definitions.
- No unexpected schema objects were removed or replaced.
- Foreign-key check returns zero violations.
- All protected row counts and key-field checks reconcile.
- Migration-specific invariants pass, including 0035 rating mapping and averages, 0040 request preservation/status normalization, financial idempotency, reviewer separation, and AI token fencing.
- Worker compatibility tests pass against the migrated disposable database.
- The backup can be restored independently and the restored database passes the same baseline inventory checks.

## Release-runner design constraints

A future runner must be a separate reviewed change. It must:

- Require manual dispatch and an explicit production confirmation.
- Verify the target account/database identity before any write.
- Require a fresh verified backup artifact before the first schema mutation.
- Apply only the explicitly reviewed pending migrations, in numeric order, with exact file checksums.
- Use a migration ledger only after its format, trust boundary, and reconciliation with historical production state have been reviewed. Never mark a migration applied merely because its objects happen to exist.
- Record durable per-migration start/success/failure evidence without logging secrets or user content.
- Stop immediately on any error or failed postflight. Never auto-skip, auto-retry non-idempotent DDL, or continue to Worker deployment after a partial failure.
- Make no claim of transactional rollback for DDL unless proven for the exact D1/SQLite operation. Prefer restore/forward-recovery plans tested in rehearsal.
- Deploy the Worker only after every migration postflight and compatibility assertion passes.
- Run a read-only live health/schema check after deployment and preserve its output.

## Current release status

- Production read-only audit executed: **No evidence recorded in this development task.**
- Production backup exported and restored: **Not verified.**
- Production migration ledger reconciled: **Not verified.**
- Production-shaped rehearsal: **Not completed.**
- Production migrations applied: **No.**
- Worker deployed by this task: **No.**

The fail-closed deployment gate must remain in place until all required evidence exists and a separate release-runner change has passed review.
