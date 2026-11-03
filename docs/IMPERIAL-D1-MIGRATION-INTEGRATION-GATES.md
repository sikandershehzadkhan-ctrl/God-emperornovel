# Imperial Novel database migration integration gates

Status: investigation note, not an approved migration plan.

## Verified branch facts

The following SQL files were fetched directly from the named development branches:

| Branch | Migration | Observed purpose |
|---|---|---|
| `feature/profile-identity-17-23` | `0012_user_profiles.sql` | Adds public-profile fields and a profile visibility index to `users`. |
| `feature/account-username-security-17-24` | `0012_user_profiles.sql` | Same profile migration blob as the profile branch. |
| `feature/account-username-security-17-24` | `0013_username_change_cooldown.sql` | Adds username-change timestamp/history and username reservation/collision triggers. |
| `feature/account-username-security-17-24` | `0014_account_preferences.sql` | Adds `users.preferences_json`. |
| `feature/author-studio-workflow-17-49` | `0012_chapter_revisions.sql` | Creates chapter revision history and its lookup index. |
| `feature/author-studio-workflow-17-49` | `0015_author_private_notes.sql` | Creates author-owned private notes with owner/story/chapter references. |
| `feature/author-studio-workflow-17-49` | `0016_reader_progress_sync.sql` | Adds bounded progress percentage to reading history and an updated-time index. |

## Confirmed integration blocker

Migration number `0012` has two different SQL payloads across active feature branches:

- Profile branch: `0012_user_profiles.sql`
- Author Studio branch: `0012_chapter_revisions.sql`

They cannot both be applied as independent migrations under the same D1 migration sequence. This is a real branch integration conflict. The account branch shares the profile branch's `0012_user_profiles.sql` content.

## Safe integration requirements

1. Reconcile feature branches against the actual current default-branch migration history before assigning any new migration numbers.
2. Keep each logical migration exactly once. Do not edit or renumber migrations that may already have been applied to a database.
3. For not-yet-released feature migrations, allocate unique, monotonically increasing filenames after the latest migration already present on the integration base.
4. Preserve the SQL payload and review dependencies, indexes, triggers, foreign keys, and rollback/forward-only implications independently of filename changes.
5. Inspect the complete branch diffs and migration directory before preparing the combined integration branch. The guessed `migrations/0008...` paths were not found on `main`, so this note deliberately does not assert the current production migration head.
6. Validate the combined migration sequence against a disposable local D1/SQLite database seeded from the actual baseline, then run the complete repository checks.
7. Do not execute migrations against production D1 as part of branch reconciliation. Production rollout requires a separately reviewed migration plan and backup/restore readiness.

## Explicitly not verified

- Whether any of these branch migrations have already been applied to production or staging.
- The latest migration number on the current default branch.
- Whether additional migrations exist under alternate paths or later commits on these branches.
- Whether the feature branches' route handlers and UI are mutually compatible after a merge.

## Release gate

Do not merge the profile/account and Author Studio branches together until the migration inventory, sequence, and disposable-database rehearsal are complete. This note is a guardrail, not evidence that the features are production-ready.


## Additional account-branch audit findings (verified)

A deeper comparison of `feature/account-username-security-17-24` found two more release blockers:

### Duplicate migration payloads within the account branch

- `0013_username_change_cooldown.sql` and `0017_username_change_cooldown.sql` both add `users.username_changed_at`, create `username_history`, and install the username-history/collision triggers. They are separate migration files with the same schema intent. If both are included in one fresh migration chain, the second `ALTER TABLE users ADD COLUMN username_changed_at` will fail because the column already exists.
- `0014_account_preferences.sql` and `0018_account_preferences.sql` have the same content blob and both add `users.preferences_json`. Applying both likewise fails on the duplicate column.

These are not just cross-branch filename collisions. The account branch itself contains duplicate numbered migrations. The branch must be reconciled before a full-chain rehearsal can pass.

### Historical username protection does not cover account registration

The account branch's `/api/auth/register` handler inserts directly into `users` after checking syntax and rate limits. It does not check `username_history`. The migration's database trigger `trg_users_reject_historical_username_reuse` is defined only `BEFORE UPDATE OF username`, not `BEFORE INSERT ON users`.

The username-change endpoint does query `username_history`, so the gap is specific to new registrations. A new user could potentially claim a name previously held by another account.

Recommended fix before release:
1. Add a case-insensitive `BEFORE INSERT ON users` trigger rejecting names present in `username_history`, so the invariant is enforced even if an API pre-check is bypassed.
2. Add an API pre-check for a clear conflict response, while treating the database trigger as authoritative.
3. Extend `scripts/test-account-identity-migration.py` to attempt a new user insert using a historical name and assert an integrity error.
4. Extend `scripts/test-account-identity-policy.mjs` to assert the insert trigger exists and registration is protected.
5. Reconcile duplicate `0013/0017` and `0014/0018` files only after establishing which migration numbers have been applied anywhere. Never delete or rewrite an applied migration.

## Updated release gate

The account branch is not ready for migration rehearsal until its duplicate migration payloads are resolved. The registration historical-name gap must also be fixed and tested before account identity work is considered security-complete.
