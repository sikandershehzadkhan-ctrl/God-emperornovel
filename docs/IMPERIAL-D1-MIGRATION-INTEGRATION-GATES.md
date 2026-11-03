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
