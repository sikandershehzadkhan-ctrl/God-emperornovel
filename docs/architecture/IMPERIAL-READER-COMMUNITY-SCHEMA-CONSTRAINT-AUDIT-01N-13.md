# Phase 01N.13 — Reader and Community Schema Constraints

Status: migration inventory and runtime schema bootstrap inspected after the first reader/community endpoint review. This supplements Phase 01N.12 and corrects earlier uncertainty about uniqueness guarantees. It is not a live D1 schema inspection.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Sources:
- `migrations/0001_initial.sql` blob `478c9ff587878b8967ffa0f4f1648abce3ed7bc8`
- `migrations/0003_finish_product.sql` blob `bae02459c93b61c37dd0bd64f4ed4282bd473139`
- `migrations/0008_discovery_community.sql` blob `21fd33c85e10d95b419f372953d3f5d057646a7c`
- `migrations/0016_reading_positions.sql` blob `62031dc11ff5b4c54526317c56185cebe132a0e4`
- `migrations/0017_ten_point_ratings.sql` blob `616bc90ff3069ebf52d93d381529f750750498a2`
- `migrations/0018_comment_reports.sql` blob `86c384089ecb0b32e822f0dacb0dc76757fa97c4`
- `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`

## 1. Confirmed uniqueness and relational constraints

| Table | Constraint observed | Meaning |
|---|---|---|
| `unlocks` | PRIMARY KEY (`user_id, chapter_id`) | One unlock per user/chapter |
| `bookmarks` | PRIMARY KEY (`user_id, novel_id`) | One bookmark per user/novel |
| `history` | PRIMARY KEY (`user_id, novel_id`) | One history row per user/novel |
| `request_votes` | PRIMARY KEY (`request_id, user_id`) | Concurrent duplicate votes prevented at DB uniqueness layer |
| `ratings` | PRIMARY KEY (`user_id, novel_id`), rating CHECK 1–10 | One rating per user/novel |
| `comment_likes` | Runtime-created PRIMARY KEY (`user_id, comment_id`) | One like per user/comment |
| `novel_reactions` | Runtime-created PRIMARY KEY (`user_id, novel_id`) | One reaction per user/novel |
| `comment_reports` | Runtime-created UNIQUE (`user_id, comment_id`) | One report per user/comment |
| `reading_positions` | PRIMARY KEY (`user_id, novel_id, chapter_number`), progress CHECK 0–100 | One progress row per user/chapter |

## 2. Important schema observations

- `request_votes` uniqueness is defined in migration 0008. The handler's check-then-insert is backed by the primary key, though concurrent duplicate insert handling should still be tested and mapped to a clean response.
- Ratings are rebuilt in migration 0017 with a 1–10 CHECK and composite primary key.
- `comment_likes`, `novel_reactions`, `comment_reports`, `reports` and `notifications` are created by runtime schema bootstrap in `src/index.js` rather than by the visible ordered migration files in this branch.
- Migration 0018 is deliberately dependency-free and says the canonical comment-report schema is owned by a separate migration from PR #118. That referenced migration is not present in this branch's visible migration listing. The runtime bootstrap currently creates the table and indexes, but release integration must reconcile migration history so a clean D1 install and an upgraded D1 behave identically.
- Several account-associated tables in the older migrations have user ID columns but no declared foreign key. Application SQL scoping is present, but DB-level cascade/orphan protection is not uniformly defined.
- The initial `bookmarks` and `history` tables do not declare foreign keys to novels or chapters. Their reads join published novels, and writes validate published chapter existence, but stale/orphan rows may persist after content changes unless cleanup is implemented elsewhere.
- `reports` has no visible uniqueness, target foreign key or dedicated index in the inspected schema. Its generic endpoint also lacks visible target relationship validation and hourly rate limiting.
- `notifications` is created without a declared foreign key to users in the runtime bootstrap. The query/write predicates scope notifications to the current user, but referential cleanup should be addressed.

## 3. Specific recommended hardening

1. Add explicit target validation to generic `POST /api/report`: at least one target required, target IDs must exist, chapter must belong to supplied novel when both supplied, and target must be eligible for reporting.
2. Add per-user report rate limits and duplicate-report policy to generic reports.
3. Add indexes for generic reports by status/date and target IDs where moderation queries require them.
4. Reconcile runtime-created schema with ordered migrations, avoiding conflicting definitions and ensuring fresh-install reproducibility.
5. Consider foreign keys with safe delete behavior for account-owned tables; evaluate content retention and audit/legal requirements before cascading data.
6. Add orphan-row detection/cleanup for history and bookmarks.
7. Catch uniqueness races in vote handlers and return deterministic idempotent responses.
8. Add migration integration tests from an empty D1 and from each supported upgrade checkpoint.

## 4. Phase 01N.13 disposition

- [x] Inspect vote, rating, unlock and reader-position uniqueness constraints.
- [x] Inspect reaction, like and comment-report runtime constraints.
- [x] Identify runtime-created versus ordered-migration-owned tables.
- [x] Confirm generic reports schema lacks visible target FK/unique constraint.
- [x] Record migration integration/reproducibility risk.
- [ ] Inspect live D1 schema and migration history.
- [ ] Reconcile canonical runtime and migration schema ownership.
- [ ] Implement and test generic report validation/rate limits.
- [ ] Run empty-database and upgrade migration tests.
- [ ] Run cross-account and concurrency tests.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.
