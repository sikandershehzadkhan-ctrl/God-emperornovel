# Imperial Novel Database Migration Collision Register

**Audit date:** 2026-11-04  
**Scope:** Current `main` migration filenames and migration files added by open PRs #87, #88, #118, #120, #123, #124, #129, #130, #171, #173 and #174.  
**Purpose:** Prevent incompatible branch migrations from being combined or applied in an unsafe order.

## Executive finding

The current `main` branch contains migrations `0001_initial.sql` through `0011_author_applications.sql`. Multiple open feature branches independently allocate the same subsequent sequence numbers to different schema changes. At least one branch (#124) also introduces files numbered 0009–0011, which overlap sequence numbers already present on `main`.

This is an integration blocker, not a cosmetic filename problem. A migration runner commonly records applied migration filenames or identifiers. Renaming a migration after it has been applied can cause it to run again; two different files with the same sequence can also produce inconsistent fresh-install and upgrade behavior.

**Do not merge or deploy the affected migration branches as a bundle. Do not renumber migrations until the actual D1 applied-migration inventory has been obtained.**

## Current main baseline

`main` currently contains:

- `0001_initial.sql`
- `0002_omniportal.sql`
- `0003_finish_product.sql`
- `0004_legal_publishing.sql`
- `0005_chapter_publishing.sql`
- `0006_rights_first_security.sql`
- `0007_ai_author_studio.sql`
- `0008_discovery_community.sql`
- `0009_catalog_filter_indexes.sql`
- `0010_catalog_sort_indexes.sql`
- `0011_author_applications.sql`

## Open-PR migration inventory

| PR | Workstream | Migration files observed |
|---|---|---|
| #173 | Reader profiles | 0012 user profiles |
| #174 | Account identity/security | 0013, 0014, 0017, 0018, 0019 |
| #129 | Chapter revisions/scheduling | 0012, 0013 |
| #130 | Author Studio goals/notes | 0014, 0015 |
| #118 | Runtime community schema | 0012 |
| #120 | Discovery/reader metrics/ratings | 0013–0018 |
| #123 | Runtime schema + reader/account features | 0012–0019 |
| #171 | Design foundation integration | 0012–0013 |
| #124 | Creator ownership/account deletion | 0009–0019 |
| #87 | Media asset registry | 0012 |
| #88 | Media rights/comic/payment safeguards | 0012–0021 |

This inventory is based on the open pull-request file lists at audit time. It is not a statement that every PR is approved, merged, deployed, or applied to any database.

## Sequence collisions

| Sequence | Conflicting changes observed |
|---|---|
| 0009–0011 | PR #124 adds password-reset/email-verification migrations while main already has catalog indexes and author applications |
| 0012 | Profiles (#173), chapter revisions (#129), runtime schema (#118/#123), ratings (#171), ownership transfers (#124), media assets (#87/#88) |
| 0013 | Username cooldown (#174), scheduled publishing (#129), chapter timestamps (#120/#123), reader progress (#171), account deletion (#124), media publication gates (#88) |
| 0014 | Account preferences (#174), author goals (#130), engagement metrics (#120/#123), account deletion (#124), comic owner guards (#88) |
| 0015 | Author private notes (#130), daily analytics (#120/#123), account deletion review store (#124), media rights review (#88) |
| 0016 | Reading positions (#120/#123), account deletion reviewer roles (#124), media storage quotas (#88) |
| 0017 | Username cooldown (#174), ten-point ratings (#120/#123), account deletion disposition plans (#124), comic draft guards (#88) |
| 0018 | Account preferences (#174), comment reports (#120/#123), account deletion approvals (#124), donation review audit (#88) |
| 0019 | Historical username insert guard (#174), account closure (#123), account deletion findings (#124), admin ticket adjustments (#88) |

## Duplicate or overlapping migration payloads

The following duplicates/overlaps were observed from the changed-file patches:

1. **PR #174:** `0013_username_change_cooldown.sql` and `0017_username_change_cooldown.sql` implement substantially the same username history/cooldown schema and guards under different sequence numbers.
2. **PR #174:** `0014_account_preferences.sql` and `0018_account_preferences.sql` contain the same `ALTER TABLE users ADD COLUMN preferences_json ...` statement. Applying both to the same database will fail because the column already exists.
3. **PR #118 and #123:** both add `0012_runtime_feature_schema.sql`. Their relationship must be resolved to one canonical source, not applied twice.
4. **PR #87 and #88:** both add `0012_media_asset_registry.sql`. The registry should have one canonical migration owner.
5. **PR #120 and #123:** overlapping chapter timestamp, engagement metrics, daily analytics, reading positions, ten-point ratings and comment-report migration slots appear in both branches. The patches must be compared and one canonical implementation selected.
6. PR #120's `0014_reader_engagement_metrics.sql` and `0018_comment_reports.sql` are documented as intentional no-op slots because PR #118 owns the relevant schema. These are still sequence occupants and must not be mistaken for independent DDL.

## Integration hazards beyond numbering

- **Destructive table rebuild:** PR #120/#123's ten-point rating migration creates a replacement table, copies rows, drops `ratings`, then renames the replacement. It requires a verified schema/data rehearsal and preservation of indexes/triggers/foreign keys before release.
- **Data cleanup:** PR #123's runtime schema migration archives and deletes invalid/duplicate comment reports and removes orphan interactions. The effects need a before/after row-count report on a disposable copy.
- **Account branch dependency:** PR #174 currently targets the profile branch rather than `main`. Preserve this dependency or rebase deliberately after migration ownership is settled.
- **Creator account lifecycle:** PR #124 contains a multi-migration deletion/ownership-transfer workflow. Its dependencies on users, novels, chapters, roles and audit records must be verified against the actual baseline and other security migrations.
- **Migration guard correctness:** PR #177 now replaces the unsafe whitespace normalizer with a quote-aware canonicalizer that preserves whitespace inside string literals and quoted identifiers, and includes regression self-checks. It is a conservative lexical duplicate check, not a full SQL semantic-equivalence engine.

## Required safe integration procedure

1. Freeze creation of new numbered migrations on independent feature branches. New schema work should be authored against one designated integration branch.
2. Obtain a read-only inventory of applied migration identifiers from each relevant D1 environment, including production and staging. Do not infer applied state from Git.
3. Preserve the original migration files and hashes. Determine whether any conflicting migration has already been applied in any environment.
4. Build a dependency graph for every migration: required tables/columns, created objects, changed constraints, data transformations and reverse/rollback considerations.
5. Choose one canonical owner for each logical schema change. Consolidate duplicate implementations before assigning a single monotonic sequence after the verified baseline.
6. Never rewrite an already-applied migration in place. If an applied migration needs correction, add a forward corrective migration with a new identifier.
7. Rehearse the full canonical chain against a disposable SQLite database initialized from the exact baseline. Include representative legacy rows and verify foreign keys, indexes, triggers, row counts and application tests.
8. Run the Cloudflare build and D1 migration validation on the integrated branch.
9. Stage the migration against a disposable/staging D1 first. Production rollout requires backup, explicit release approval, monitoring and a documented recovery plan.

## Focused review: chapter revision concurrency and financial ledger controls

Reviewed PR #129 at `3f814b5b45cbe4cc9ae15f932e3a88fb9e0719b2` and PR #88 at `d58faf28bd83b7700f6263fe19636923ea59224e`.

### PR #129: chapter revisions and scheduled publication

Positive findings:
- Chapter editing snapshots the prior chapter values and updates the chapter in one D1 batch. The snapshot is conditional on a material change and records chapter number, title, body, lock state, ticket cost, editor, and timestamp.
- Revision-history reads are owner-scoped, newest-first, and bounded to the latest ten entries.
- Schedule rows are one-per-chapter, indexed by due time, and cascade when the chapter is deleted.
- Schedule creation checks author ownership, published novel status, rights eligibility, and a bounded time window. It supports rescheduling and cancellation.
- The scheduled processor rechecks that the chapter is still draft and that the novel is still published with eligible rights before publishing. The conditional update prevents two workers from publishing the same draft twice. The 15-minute cron cadence is explicitly surfaced in the UI.

Important gap:
- The chapter PATCH route first reads the chapter/novel and checks the current owner, then its later revision INSERT and chapter UPDATE statements are keyed by chapter ID, not guarded again by the current novel owner. A concurrent ownership transfer between the initial authorization read and the write batch creates a time-of-check/time-of-use window: the former owner may still write after losing ownership.
- Fix both write statements with a database-side ownership predicate tied to the authenticated user, and require the expected current owner in the same write batch. The snapshot should only be inserted if the guarded chapter update is eligible, and a zero-row update must return a conflict without reporting success.
- Review other author write endpoints for the same read-authorize-then-write pattern, especially publish, schedule, delete, and media operations.
- Revision history has no retention/size policy. The UI reads only ten rows, but old chapter bodies can accumulate indefinitely. Define bounded retention or storage quotas without deleting legally required or author-requested recovery history.
- The chapter revision migration does not add an explicit CHECK for nonnegative `ticket_cost`; the API validates it, but database-level validation would protect other write paths.
- The scheduled publication tests are predominantly source-contract checks. Add disposable SQLite/D1-compatible behavior tests for concurrent edits, transfer during an edit, cancel-vs-cron races, chapter deletion, rights revocation, novel unpublishing, and duplicate cron execution.

**Disposition:** do not treat author write authorization as race-safe until the owner predicate is moved into the mutation statements and tested.

### PR #88: ticket ledger, donations, adjustments, refunds

Positive findings:
- Donation review records are immutable and attributable. The later independent-review migration rejects donor self-approval at the database boundary.
- Donation approval posts the reviewed Crown amount to the user's balance and ticket ledger through database triggers. Repeating an already-finalized status does not post a second credit.
- Administrator adjustments have unique idempotency keys, immutable audit rows, and trigger-owned balance plus ledger posting. The Worker endpoint rejects self-credit, validates a reason and uses rate limiting.
- Novel-request refunds are one-per-request, require a rejected paid request, an independent admin, and an amount matching the original request cost. A trigger posts the balance credit and ledger row together. The Worker uses a conditional pending-to-rejected transition and inserts the refund only when that transition changed one row.
- Payment reconciliation is explicitly read-only and reports normalized duplicate provider references, finalized donations without reviews, donation/ledger mismatches, and unmatched payment ledger entries. Ticket reconciliation is also read-only and reports account-vs-ledger discrepancies and orphan ledger rows.

Open risks / integration gates:
- The donation self-review protection is introduced by migration `0020_donation_independent_review.sql`, which replaces the earlier trigger. A database that applies `0018_donation_review_audit.sql` but not `0020_donation_independent_review.sql` remains vulnerable to direct-SQL self-review. The canonical migration plan must preserve this dependency and prove the final trigger definition.
- Donation approval amount is a manually reviewed Crown credit, not proof that a payment provider settled the same amount. Keep provider receipt verification as a human operational control until authenticated provider webhooks/reconciliation exist. Never describe a pending donation as paid or an approved Crown credit as cash income.
- The payment ledger lookup index on `ticket_ledger(reference)` is deliberately non-unique. Before considering uniqueness, inspect historical duplicate references and verify all payment, adjustment, and refund reason/reference conventions. Do not impose uniqueness blindly.
- The reconciliation module is read-only and bounded in its detailed result sets. Its summary counts are useful, but it does not repair mismatches. Treat every discrepancy as an investigation case, not an invitation to auto-adjust user balances.
- Refund database validation verifies request status, user, amount, and admin role at insertion. The operational path must still ensure the original request charge exists in the ledger and that the request was actually charged before approving a refund. Add a precondition/reconciliation check for the original charge, and test deleted/suspended user edge cases and role changes.
- Ticket balances use numeric storage in legacy schemas. Confirm integer-only Crown invariants across all credit, charge, unlock, refund, and migration paths before applying stricter constraints.
- PR #88's migration files `0018` through `0021` collide by number with other open PR migrations. Their ordering and dependencies cannot be inferred from filenames alone.

**Disposition:** strong database-level posting controls are present in the reviewed migrations, but no payment/refund migration may be deployed until the complete ordered migration chain, historical ledger reconciliation, and provider-reference audit pass on a representative staging copy.

## Focused review: Crown ledger, donations, administrator adjustments, and refunds

Reviewed PR #88 at head `d58faf28bd83b7700f6263fe19636923ea59224e`, including migrations 0018-0021 and its Worker payment/ticket routes. These migration numbers collide with unrelated migrations in other open PRs and are not safe to apply as a sequence.

### Positive findings

- Donation approval records an immutable reviewer decision with a required note; the Worker rejects self-review, and migration 0020 adds a database-level independent-review check.
- Donation credit and ledger posting are triggered by the pending-to-approved status transition, preventing repeat posting on ordinary status retries.
- Admin Crown adjustments have unique idempotency keys, immutable audit records, and a database trigger that posts both balance and ledger changes.
- Paid novel-request refunds have a unique request reference, immutable records, and a database trigger that credits the account and appends the ledger row together.
- Automated payment webhooks are explicitly disabled pending provider signature, amount/currency, event identity, and replay validation. Manual donation review remains the stated path.
- The code includes admin reconciliation endpoints for account balances versus ledger totals.

### Critical integration and accounting gates

1. **Migration identity collision:** PR #88 uses migration numbers 0018-0021, while other branches use the same numbers for unrelated schemas (including comment reports, account-deletion workflows, and username/account-preference changes). Never apply these files by number until a canonical migration chain is assembled.
2. **Balance precision mismatch:** the foundational schema defines `users.tickets`, `ticket_ledger.delta`, unlock costs, and request costs as REAL. New adjustment/refund paths validate integer amounts, but legacy balances and ledger rows can still contain fractional values. Define a forward-only precision policy and reconcile existing fractional values before claiming integer-only Crown accounting.
3. **Donation legacy rows:** the approval trigger protects new pending-to-final transitions, but legacy donations already marked approved may have no corresponding `donation_reviews` row. Do not backfill or re-credit them blindly. Reconcile donation status, review evidence, account credit, and ledger posting as separate facts.
4. **Trigger deployment dependency:** donation approval depends on the review row being inserted before the status transition in the same batch. Validate D1 batch transaction behavior and ensure a failed second statement rolls back the review insert and status transition together.
5. **Admin adjustment authorization:** the adjustment trigger posts any valid row inserted into `admin_ticket_adjustments`; the trigger itself does not verify the actor's current admin role. The API checks admin authorization, but direct SQL writers or compromised privileged paths could bypass that application check. Add a database-side role/banned-state guard and test demotion/revocation races.
6. **Refund authorization:** the refund trigger verifies that the referenced actor is currently an admin and is not the beneficiary, plus matching rejected request and amount. Confirm the request transition and refund insert are atomic, and test retries, duplicate requests, changed request amount, admin demotion, and concurrent review.
7. **Account deletion retention:** immutable donation reviews, admin adjustments, and refunds use RESTRICT references to users. Account deletion must preserve or legally minimize financial audit records without orphaning them or exposing private payment references.
8. **Ledger integrity:** the current reconciliation compares current balances with the sum of all ledger deltas, but that is not proof of correctness if legacy rows are missing, duplicated, or were posted outside the ledger. Before any repair, snapshot aggregate totals, duplicate references, orphan rows, negative balances, fractional balances, and per-reason distributions. Repairs must be separately approved and append-only.
9. **Payment references:** the donation migration intentionally adds a non-unique payment-ledger reference index rather than imposing uniqueness over historical rows. Preserve this conservative choice until a duplicate audit proves a unique constraint safe.

**Disposition:** these are promising accounting controls, not production-ready financial infrastructure. No money movement, ticket adjustment, migration, or production reconciliation was executed during this review. Keep automated payment confirmation disabled until a real provider-specific verification design and tests exist.

## Focused review: chapter revisions and scheduled publication

Reviewed PR #129 at head `3f814b5b45cbe4cc9ae15f932e3a88fb9e0719b2`, including both migrations, Worker routes, regression tests, and the changed production deployment workflow.

### Chapter revision snapshots

Positive findings:
- The edit route checks the current novel owner (or admin) before editing.
- It inserts a snapshot of the previous chapter state and updates the chapter in one D1 batch; the snapshot is conditional on an actual content/metadata change.
- The snapshot retains chapter number, title, content, lock state, ticket cost, editor ID and timestamp.
- Revision history is owner-scoped, newest-first, and limited to ten records.
- Deleting a chapter cascades its revision history; deleting an editor user sets the editor reference to NULL.

Open issues:
- The authorization check occurs in a read before the write batch. The snapshot INSERT and chapter UPDATE themselves do not repeat the novel-owner predicate. If ownership changes between the check and batch, a stale author session could potentially write after losing ownership. Recheck ownership inside each write statement or use a transactionally guarded write pattern, and test the ownership-change race.
- There is no retention cap on stored revision rows. The API only returns ten, but every changed save can continue adding full chapter-body copies. Define retention/quotas and ensure creator export and account deletion account for revision content.
- Revision history exposes full historical chapter content to the current owner and admins. That is reasonable for editing, but verify admin access is audited and does not bypass a rights dispute or legal hold.
- Tests currently assert SQL source patterns and UI affordances. Add SQLite behavior tests for unchanged saves, repeated edits, ownership change between authorization and write, editor deletion, chapter deletion, and revision retention.

### Scheduled chapter publication

Positive findings:
- Scheduling is owner-scoped, requires a published novel and eligible rights, accepts only a time 5 minutes to 365 days ahead, and supports cancellation/rescheduling.
- The cron worker rechecks that the chapter remains draft and the novel remains published with eligible rights before publishing.
- Schedule deletion and audit insertion are conditioned on a successful chapter update; the creator is notified after successful publication.
- The schedule table has one row per chapter and cascades on chapter deletion.

Open issues:
- The due query silently excludes schedules whose novel is no longer published or whose rights become ineligible. Those schedules remain stored indefinitely and are never surfaced by this processor. Add an explicit blocked/needs-review state or a fail-closed cancellation path with an audit event and creator notification; do not silently leave overdue schedules stuck.
- The schedule stores `created_by`, but the processor notifies that original user even if novel ownership has since transferred. Define transfer behavior: cancel and notify the old creator, reassign only with explicit consent, or preserve the original creator as schedule author while notifying the current owner too.
- The Worker processes at most 100 due rows per invocation. Confirm the 15-minute cron and repeated invocations drain backlogs safely, and add metrics/alerting for overdue schedules.
- The batch relies on sequential `changes()` checks to conditionally delete the schedule and write the audit record. Validate this exact behavior against the deployed D1 runtime, including a failed chapter update and a retry; unit/source checks alone are insufficient.
- The deployment workflow in this PR directly applies migrations `0012_chapter_revisions.sql` and `0013_scheduled_chapter_publications.sql`. These sequence numbers collide with several other open PRs and do not represent a safe globally ordered migration chain. The workflow must not be dispatched until the canonical migration history is reconciled and production schema has been read-only audited.

**Disposition:** useful revision and scheduling foundations, but the ownership race, stale/blocked schedule lifecycle, unbounded body snapshots, and migration collision prevent production approval. No production workflow was dispatched and no D1 was modified.

## Focused review: author-private data, creator transfers, deletion workflow, and community cleanup

Reviewed SQL and application/test source at PR #130 head `84e3541d6b588110669cb2161dcb6eb5af788435`, PR #124 head `161e66652208a516248ca8867b35b6a52c3280e8`, and PR #118 head `1f69507f32cd1589fe076ad69381b8d8a6ba7d0b`.

### PR #130: owner scoping is present in application routes, but transfer semantics are unresolved

Positive findings:
- Goal reads require both `author_story_goals.owner_user_id` and current `novels.owner_user_id` to match the session user.
- Goal creation/upsert uses an `INSERT ... SELECT` from a novel owned by the session user and prevents overwriting another stored owner's goal.
- Private-note reads, creates, updates, and deletes recheck the session owner and current novel owner. Note creation also verifies that an optional chapter belongs to the selected novel.
- Regression tests assert several of these conditions.

Open issue:
- Both tables store an owner ID separately from the novel. PR #124's ownership-transfer trigger changes `novels.owner_user_id`, but does not define what happens to `author_story_goals.owner_user_id` or `author_private_notes.owner_user_id`.
- After a successful transfer, existing rows remain assigned to the former owner. The current PR #130 read queries require the row owner and current novel owner to match, so those rows become invisible to both former and new owners. This may be correct for private notes, but the product/data-retention policy must explicitly decide whether goals/notes remain with the creator, transfer to the new owner, or are archived/exported.
- The schema does not enforce that `author_private_notes.chapter_id`, when present, belongs to the same `novel_id` in that note. The current API checks this on creation, but a composite database constraint/trigger would protect other write paths too.
- Required tests: transfer with existing goals and notes; verify former-owner access is revoked as intended; verify new-owner access follows the chosen policy; ensure no cross-owner leakage; verify deletion/export behavior.

**Disposition:** application-level ownership checks look deliberately scoped in the reviewed routes. Do not call this data lifecycle complete until ownership-transfer behavior is explicitly decided and tested.

### PR #124: account deletion review and creator transfer

Positive findings:
- Deletion requests are workflow records, not direct erasure commands; active requests are unique per user and have a cooling-off schedule.
- Review records bind request and subject IDs, use version increments, and retain append-only review events.
- Approval records are immutable and bind an independent approver to the exact plan digest. The reviewed SQL prevents the subject and proposer from acting as approver.
- Ownership transfer acceptance is guarded in a SQLite trigger: the invitation identity is immutable, expiry is checked, current ownership is rechecked, recipient eligibility and rights evidence are checked, and the novel update must affect exactly one row.
- SQLite tests exercise accepted transfer and rejection for banned/non-author recipients, stale ownership, expired invitations, changed invitation identity, and missing rights evidence.

Open issues / required validation:
- `novel_ownership_transfers` intentionally stores actor IDs without foreign keys, preserving numeric audit history. Document the retention rationale and ensure account export/deletion policy handles these IDs as retained audit references rather than active account data.
- The trigger protects acceptance, but request creation, cancellation, rejection, expiry, and authorization still depend on Worker policy. Test every transition against stale owner/session state and replay attempts.
- Account-deletion tables use RESTRICT relationships, intentionally preventing erasure while review evidence depends on the subject. A future finalization workflow must define how legally required audit evidence is minimized/pseudonymized without breaking referential integrity. The current migrations explicitly do not enable finalization or erasure.
- Ensure account deletion cannot proceed while creator-owned works, pending transfers, ticket balances, financial records, or legal-retention obligations require a separate disposition.
- Validate the full ordered migration chain before relying on these SQL tests in isolation; this PR's migration numbering collides with existing `main` history.

### PR #118: community data cleanup

Positive findings:
- Duplicate and orphan comment reports are copied into `comment_reports_legacy_duplicates` before deletion, retaining report IDs, reporter/comment IDs, reason, details, status, original timestamp, archive timestamp, and archive reason.
- Duplicate report resolution keeps the earliest row per user/comment.
- The migration adds parent-validation triggers and cleanup/cascade triggers for legacy interaction tables that predate foreign keys.
- The dedicated SQLite test exercises deletion of parent records and verifies cleanup behavior.

Data-loss / operational gate:
- Orphan or duplicate `comment_likes`, `novel_reactions`, and `request_votes` are deleted rather than archived. Their parent references are invalid, so they cannot contribute to valid current engagement, but their removal still changes historical raw counts. Capture before/after counts by table and reason in staging, and ensure analytics never represented these invalid rows as valid engagement.
- The cleanup migration mutates existing community tables. It must be rehearsed against a representative copy and produce explicit counts for archived reports, removed reports, removed likes, reactions, and votes before production consideration.
- Verify the archive table's access policy: it is moderation/audit evidence, not public API data. Confirm ordinary readers and authors cannot query archived report details.

**Disposition:** no production migration execution until the data cleanup counts and archive access boundaries are validated.

## Focused data-preservation review: ratings and reader progress

Reviewed the actual SQL and regression tests at PR #171 head `574b37bab1eb0426bc0032f79eceb3c4ca0a4588`, and the competing ratings migration at PR #123 head `5a2e5b8f3b7db97cbf878e71c0acd9c1f1716eb5`.

### Rating migration conflict: do not apply either migration yet

- PR #171 `0012_ten_point_ratings.sql` rebuilds `ratings`, maps values 1–5 to 2,4,6,8,10, drops the original table, renames the replacement, and recomputes `novels.rating`.
- PR #123 `0017_ten_point_ratings.sql` also rebuilds `ratings`, but copies existing values unchanged where they are between 1 and 10, silently excluding any out-of-range rows before dropping the old table.
- These are not equivalent transformations. PR #171 assumes every stored value 1–5 belongs to an old five-point scale. PR #123 assumes values 1–10 are already ten-point values.
- The PR #171 Worker source and rating regression test already enforce/expect whole-number ratings from 1 to 10. If production has accepted ten-point votes before the migration, PR #171 would double the value of every existing 1–5 vote. Conversely, PR #123's filtered copy would discard invalid legacy rows without archiving them or reporting a count.
- Both scripts use a table rebuild. The reviewed SQL does not explicitly preserve arbitrary indexes, triggers, or foreign-key relationships attached to the old `ratings` table. Those must be inventoried and recreated/verified where applicable.
- PR #171's regression test checks the intended mapping in SQL text, but does not by itself prove preservation of representative live rows, table dependencies, or mixed historical scale data.

**Required resolution before canonicalization:** inspect actual production rating values and schema dependencies using a read-only, aggregate/metadata-only audit; determine whether historic rows have reliable scale provenance. If provenance cannot distinguish five-point and ten-point rows, do not automatically remap ambiguous values. Design a forward-only migration with an explicit preservation/archive policy, pre/post row-count checks, rating distribution checks, and table-dependency verification. Do not run a destructive table rebuild until that rehearsal passes.

### Reader progress migration review

PR #171 `0013_reader_progress.sql` creates one row per `(user_id, novel_id)`, constrains chapter number and percentage, and indexes user/update time. It does not declare foreign keys to users/novels in the reviewed SQL. Its application tests assert account-scoped API reads/writes and local-vs-server timestamp reconciliation. Before integration, add disposable-database tests for orphan prevention or cleanup policy, user deletion, novel deletion, concurrent updates, and stale offline writes. The current source-level regression test is useful but is not a substitute for those data and concurrency tests.

## Cross-PR integration gate (reviewed 2026-11-04)

GitHub's `mergeable` field describes Git's ability to merge source changes; it does not establish that independent D1 migration histories are compatible. Treat these as separate gates.

| Pull request | Migration contribution / overlap | Integration disposition |
|---|---|---|
| #118 | `0012_runtime_feature_schema.sql` | Hold; same sequence as media, reader, profile, and other feature branches. |
| #120 | `0012_runtime_feature_schema.sql` and reader/ratings migration slots (including intentional no-op reservations) | Hold; integration base has multiple cross-branch overlaps. |
| #123 | Community runtime migration and reader/ratings sequence, including data cleanup and ratings-table rebuild | Hold; preserve its cleanup/rebuild semantics for a dedicated data-preservation rehearsal. |
| #124 | Account lifecycle and ownership-transfer migrations beginning at `0009` | Hold; its early sequence overlaps migrations already on `main`. |
| #129 | `0013_scheduled_chapter_publications.sql` | Hold; sequence 0013 is independently used by several branches. |
| #130 | `0014_author_story_goals.sql`, `0015_author_private_notes.sql` | Hold; sequence numbers overlap other feature migrations. |
| #171 | `0012_ten_point_ratings.sql`, `0013_reader_progress.sql` | Hold; #120/#123 and other branches use conflicting sequence slots. Its GitHub mergeability does not clear the D1 gate. |
| #173 | `0012_user_profiles.sql` | Hold; sequence 0012 conflicts with multiple independent migrations. |
| #174 | Profile/account identity migrations, including duplicate cooldown/preferences slots within its own branch | Hold; stacked on #173 and requires both source and migration consolidation. |
| #177 | Migration sequence/payload guard and fresh SQLite chain rehearsal | Keep as a validation-only draft until the integration process is established. |

### Required canonicalization sequence

1. Obtain the actual production D1 schema and migration-history evidence through an explicitly authorized read-only audit. The current repository workflow can perform this, but it has not been dispatched in this work.
2. Compare the production schema with `main` and the actual SQL payloads. A missing migration-ledger row alone is not proof that SQL was never applied because the current deploy workflow executes SQL files directly.
3. Create one integration branch from the verified production-compatible baseline. Do not merge independent feature branches merely because GitHub reports them mergeable.
4. Assign each genuinely new schema change a unique forward-only migration number in that integration branch. Preserve the original SQL intent, dependencies, constraints, triggers, indexes, and data transformations. Never rewrite a migration already applied in production.
5. Rehearse the complete chain on a disposable database seeded with representative legacy data. Verify row preservation, intentional cleanup counts, foreign keys, indexes, triggers, constraints, and application-level tests.
6. Only after the rehearsal and source CI pass should the integration PR be considered for human review. Production deployment remains a separate, explicitly approved operation.

**Current decision:** no feature PR is promoted to a canonical migration branch by this register alone. The actual production baseline is still unknown, so renumbering or consolidation would be premature.

## Production inventory and release workflow findings

A source review of `.github/workflows/audit-production-d1.yml`, `.github/workflows/deploy.yml` and `wrangler.toml` found the following operational constraints:

- The production D1 audit is a manually dispatchable workflow. It requires the explicit `confirm_read_only_audit=yes` input and valid Cloudflare GitHub Actions secrets. It checks the configured D1 identity, credential presence, Time Travel bookmark, public Worker health, table/column inventories, and (when present) `d1_migrations` history.
- The audit workflow is designed around SELECT and PRAGMA statements. It does not run migrations or deploy the Worker. Its workflow logs will contain database schema and aggregate operational information, so access to the GitHub Actions run should remain restricted to authorized maintainers.
- The production deploy workflow is also manual and requires `confirm_production_deploy=true`. Its current implementation explicitly applies only `0009_catalog_filter_indexes.sql`, `0010_catalog_sort_indexes.sql`, and `0011_author_applications.sql` before deploying. It is not a general mechanism for applying the open feature-branch migrations.
- The deploy workflow uses direct remote `d1 execute --file` calls for those three migrations rather than Wrangler's migration-ledger application command. Therefore the presence or absence of a `d1_migrations` record must not be assumed to prove that these SQL files were or were not executed. Compare the actual schema objects and the migration history together.
- The checked-in D1 binding points to `god-emperornovel-db` with database ID `78493557-1142-45e6-96aa-2ba9f67e3be0`. Confirm that this is the intended environment before dispatching any workflow.

**Operational rule:** Do not dispatch the production audit or deploy workflow as an automatic continuation step. The audit is read-only but accesses production operational metadata; it should be run only by an authorized maintainer after explicitly choosing the read-only audit input. Never dispatch production deploy as part of this migration reconciliation work.

## Validation update (2026-11-04)

- PR #177 adds a quote-aware duplicate-payload guard and runs it as part of the package build.
- PR #177 adds `scripts/test-migration-chain.py`, which applies the checked-in `main` migration chain to disposable in-memory SQLite and checks `PRAGMA integrity_check` plus `PRAGMA foreign_key_check`.
- Cloudflare Source Validation passed on PR #177 head `2710bc6e43dac973ffbfd1278b4fe7b2f55520a6`; Graphify also passed. The SQLite rehearsal step passed.
- This verifies only the current checked-in baseline on a fresh database. It does not validate colliding feature-branch migrations or production D1's applied state.

## Current disposition

- **Merge readiness:** blocked for colliding migration branches until the inventory and canonical sequence are complete.
- **Production D1:** no change authorized or performed by this audit.
- **Production deployment:** no change authorized or performed by this audit.
- **Known applied migration history:** not available from repository files alone; must be read from each D1 environment.
- **Next implementation milestone:** obtain a read-only applied-migration inventory for staging and production, then build one canonical integration branch and rehearse it against representative legacy data.

## Evidence and limitations

This register was assembled from GitHub's current `main` migration tree and changed-file lists/patches for the PRs listed above. It is a source-control audit, not a live D1 inspection. PR contents can change; refresh the inventory before integration. The register intentionally does not prescribe migration renumbering because the applied migration state is unknown.


## Focused publishing and Crown-accounting review (2026-11-04)

Reviewed PR #129 at head `3f814b5b45cbe4cc9ae15f932e3a88fb9e0719b2` and PR #88 at head `d58faf28bd83b7700f6263fe19636923ea59224e`, including the actual migration SQL, Worker source, and regression-test implementations.

### PR #129: chapter revisions

Positive findings:
- Chapter edits are owner-scoped through the chapter's novel, and the prior chapter state is inserted into `chapter_revisions` in the same D1 batch as the chapter update.
- Revision-history reads repeat the ownership check and are bounded to the latest 10 entries.
- The edit path revalidates comic content and applies a content-size bound.
- Chapter deletion cascades to its revision rows.

Ownership-transfer privacy issue:
- Revision rows are attached to `chapter_id`, not to an immutable creator/owner identity. Their `editor_user_id` records the editor, but the reviewed history endpoint authorizes access using the novel's current owner.
- PR #124's ownership-transfer flow changes `novels.owner_user_id`; it does not define a revision-history disposition. After a transfer, the new owner may gain access to previous chapter snapshots, including draft text written by the former owner, while the former owner loses access. This is a creator-confidentiality and rights-policy decision, not merely a UI issue.
- Before integration, choose and enforce a policy: preserve history as novel property with explicit transfer disclosure/consent; keep prior-owner revisions private and exportable; or create a reviewed handover/archive process. Add transfer lifecycle tests proving who can read old snapshots before and after transfer. Do not silently widen access.

### PR #129: scheduled publication

Positive findings:
- Scheduling is owner-scoped, requires a published/approved novel and eligible rights status, bounds the requested time (5 minutes to 365 days), supports reschedule/cancel, and uses an indexed due-time lookup.
- The cron processor rechecks novel publication and rights eligibility when a schedule becomes due, rather than trusting only the original scheduling decision.
- The processor ties schedule removal and audit insertion to a successful chapter publication and sends an in-app notification after success.
- The UI correctly discloses the 15-minute cron cadence; it does not promise exact-to-the-second publication.

Ownership-transfer / notification issue:
- A schedule is keyed by chapter and stores `created_by`, but the reviewed migration does not bind it to an ownership-transfer generation or immutable novel owner. The transfer workflow does not explicitly cancel, reassign, or preserve schedules.
- If a novel is transferred while a schedule is pending, the new owner can inherit the pending publication while the scheduled-publication notification still targets the original `created_by`. This can publish content under a new owner without an explicit handover decision and notify the former creator.
- Define transfer behavior for pending schedules (cancel and require new-owner rescheduling, or explicitly transfer with consent and update notification recipient). Add tests for transfer before due time, transfer at due time, revoked rights, repeated cron execution, and notification recipient correctness.

### PR #129: tests and deployment gate

- The chapter-revision and schedule tests are predominantly source-pattern assertions. They check that expected SQL/API strings and UI controls exist, but do not execute a realistic transfer lifecycle or concurrent cron/API race against a representative SQLite fixture.
- PR #129 modifies the production deploy workflow to execute migrations `0012_chapter_revisions.sql` and `0013_scheduled_chapter_publications.sql`. Those sequence numbers collide with multiple independent feature branches already inventoried above. This workflow change must not be promoted until canonical migration sequencing and the production baseline are resolved.
- PR #129 is draft and unmerged. Its passing checks, as reported in its PR body, do not clear the cross-PR migration gate.

### PR #88: Crown and payment accounting

Positive findings:
- Donation approval requires an attributable review, and a database trigger posts the user's Crown balance increase and matching `ticket_ledger` credit as part of the same status update.
- Donation reviews are immutable; the later independent-review migration blocks donor self-approval at the database boundary.
- Administrator Crown adjustments use unique idempotency keys and database-triggered balance/ledger posting, with immutable adjustment history.
- Novel-request refunds require an independently authorized admin, a rejected paid request, exact user and amount matching, and a unique request ID. Balance and ledger posting occur from the refund insert trigger; refund history is immutable.
- The payment reconciliation module is read-only and reports normalized duplicate provider references, finalized donations without reviews, donation/ledger inconsistencies, and unmatched payment-ledger entries. The separate ticket reconciliation endpoint compares account balances with ledger totals and reports orphan ledger rows.

Remaining accounting gates:
- These mechanisms account for Crown credits and refunds; they do not establish an external cash settlement, verified EasyPaisa integration, cash refund, creator revenue share, or payout ledger. Keep those features explicitly disabled/unavailable until a provider integration and settlement model are independently implemented and verified.
- The payment reconciliation fixture is synthetic SQLite data. It proves detection of selected anomaly classes, not that production payment records are clean or that provider references are independently verified.
- Before any live accounting migration, rehearse the full migration chain with legacy donation, ticket, unlock, request, adjustment, and refund records. Check pre/post user balances, ledger sums, duplicate references, orphan rows, trigger behavior, retry/idempotency, and concurrent approval/refund attempts.
- Review retention and deletion behavior for immutable donation reviews, administrator adjustments, and refunds. Their RESTRICT foreign keys intentionally preserve evidence; account deletion must have a lawful, documented disposition path rather than bypassing those constraints.
- Payment webhooks are stated to remain disabled. Do not describe submitted payment references as automatically verified or balances as cash.

**Disposition:** PR #129 and PR #88 remain draft, unmerged, and not production-ready. No production D1 data was queried or changed, and no deployment was performed. Resolve ownership-transfer semantics, build executable lifecycle/concurrency fixtures, and canonicalize all migration numbers before considering integration.


## CI follow-up: PR #88 media review fixture (2026-11-04)

A fresh inspection of PR #88's latest previously recorded Cloudflare Source Validation run (run `41282920462`, head `d58faf28bd83b7700f6263fe19636923ea59224e`) found a concrete test-fixture defect:
- The test inserted a media asset owned by user 1, then attempted to approve it using reviewer user 1.
- Migration `0015_media_rights_review_audit.sql` correctly rejects that action with `media owners cannot review their own assets`.
- The failure occurred in `scripts/test-media-asset-registry.py`; build, Worker dry-run, safety invariants, and the fresh 21-migration SQLite chain had passed earlier in that same run. Subsequent tests were skipped because the job stopped at this failure.

Correction committed to PR #88 branch `feature/media-publication-gates-0013`:
- Commit: `bce15461f4eab3ca28870c398c0bae32b9110ee4`
- The fixture now creates a separate admin reviewer and uses that account for both the immutable review row and `reviewed_by_user_id`.
- The updated file was fetched back and verified to contain the independent reviewer fixture.

**Validation status:** no post-fix Cloudflare Source Validation run was visible at the time of this update. Therefore the fixture correction is committed but not yet CI-verified. PR #88 remains draft/unmerged, and its migration collision and production gates remain unchanged.


## Focused media-storage and Crown-ledger assurance review (2026-11-04)

Reviewed PR #88's media storage setup, upload policy, media API tests, storage quota tests, donation approval, administrator adjustments, request refunds, ticket reconciliation, and chapter unlock checks.

### Media storage: secure staging boundary, not production-ready publishing

- The private media setup document explicitly requires an administrator-provisioned private R2 bucket binding. If absent, upload returns 503; no public bucket URL is exposed.
- Upload validates a 20 MiB size cap, allowed image MIME types and magic-byte signatures, uses opaque private object keys, and leaves rights pending. It does not mark an asset ready or rights-approved.
- Creator quota is 100 MiB and platform quota 1 GiB, enforced by database triggers; rejected objects continue consuming quota until confirmed deletion.
- Reader delivery checks ready + approved state, published chapter + novel, and unlock entitlement for locked chapters.
- The release documentation explicitly states there is no trusted decoder/re-encoder yet. Signature checks do not sanitize images, remove metadata, constrain pixel count, or define safe animation handling. Consequently no upload route promotes files to ready and managed images cannot be published. Keep that gate closed until a trusted image-processing pipeline exists.
- Current media test suite includes executable SQLite quota and constraint tests, JavaScript signature/metadata tests, and extensive API source-pattern assertions. The API source-pattern tests are not end-to-end R2/Worker tests; they do not prove real object cleanup behavior against a live bucket. Do not provision or expose a public bucket as a shortcut.

### Crown accounting and unlock assurance

Positive findings:
- Administrator adjustments use a unique idempotency key, reject self-credit, and database triggers post balance + ledger atomically; immutable history is enforced.
- Donation approval requires an attributable independent reviewer, records immutable review history, and posts reviewed Crowns plus one ledger entry through the same status transition.
- Novel-request refunds are one-time per request, require a rejected paid request and matching amount, reject self-refund, and atomically post balance + ledger.
- Single and batch unlock source includes conditional debit, entitlement insertion only after successful debit, server-derived pricing, and matching ledger entries.
- Ticket reconciliation is admin-only, rate-limited and read-only; it compares account balances with ledger totals and counts orphan ledger entries.

Assurance gaps:
- The ticket-unlock and ticket-reconciliation regression scripts are source-pattern checks, not executable D1 concurrency/reconciliation fixtures. They do not prove race behavior under concurrent unlock attempts, concurrent retries, or exact balance/ledger invariants over realistic account histories.
- Administrator adjustment and refund tests execute SQLite trigger behavior for duplicate/invalid requests, but do not simulate parallel requests or Worker/D1 batch retry semantics.
- Donation approval tests exercise the SQLite status transition and idempotent repeat, but not simultaneous reviewer submissions or provider-side payment settlement.
- The payment reconciliation fixture is synthetic and does not prove real provider references or cash settlement.
- Build a representative legacy ledger fixture before integration: opening balances, ticket purchases/credits, chapter unlocks, batches, refunds, admin adjustments, duplicate references, orphan entries and deleted/retained users. Assert for every account that `users.tickets = SUM(ticket_ledger.delta)` under the chosen opening-balance policy, and preserve before/after totals.
- Add executable concurrency tests using the actual supported D1/SQLite transaction semantics, including two simultaneous unlocks for one chapter, competing batch unlocks, repeated idempotency keys, duplicate donation review, and refund retry. Verify one entitlement and one ledger debit per purchased chapter.

### PR #88 CI follow-up

- The original Cloudflare Source Validation run failed at `scripts/test-media-asset-registry.py` because its fixture attempted creator self-review, correctly blocked by migration trigger `trg_media_asset_reviews_require_independent_reviewer`.
- The fixture was corrected in commit `bce15461f4eab3ca28870c398c0bae32b9110ee4` to use a separate admin reviewer. The corrected file was fetched back and verified.
- No Actions run for the corrected head SHA was visible in the branch's recent run list. Treat the correction as committed but unverified by CI until a new run completes.

**Disposition:** retain private media publishing gates; do not claim active uploads, safe image processing, or public comic publishing. Retain Crown ledger protections; do not enable cash payments, withdrawals or revenue payouts. No production R2 bucket or D1 data was accessed or changed.
