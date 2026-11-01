# Imperial Novel | Phase 01O.3: Numbered Migration Inventory & Test Matrix

**Review date:** 2026-11-01  
**Repository ref:** `architecture/phase-01m-screen-blueprint`  
**Inventory source:** GitHub migrations directory listing and fetched SQL file contents.  
**Execution status:** Static review only. No SQL was executed.

## 1. Complete directory inventory at reviewed ref

The directory listing contains 17 SQL files. The sequence has no file named 0012.

| Sequence | File | Blob SHA | Observed responsibility |
|---|---|---|---|
| 0001 | `0001_initial.sql` | `478c9ff587878b8967ffa0f4f1648abce3ed7bc8` | Users, sessions, novels, chapters, taxonomy, unlocks, library basics, comments, requests, donations, connectors, audit logs and indexes |
| 0002 | `0002_omniportal.sql` | `154516751343f512003f495484599edb547fcf9f` | Connector events, import jobs, recommendations and indexes |
| 0003 | `0003_finish_product.sql` | `bae02459c93b61c37dd0bd64f4ed4282bd473139` | Ticket ledger, follows, ratings with 1–5 CHECK, reports, notifications, app settings and indexes |
| 0004 | `0004_legal_publishing.sql` | `2e3ec126796b89e0170ff9b8a6aa18e93d58bc81` | Novel owner, publication and rights columns; publication index |
| 0005 | `0005_chapter_publishing.sql` | `3140392d19eb528a35582d76901431ccd25cd506` | Chapter publication status, publication index and chapter views |
| 0006 | `0006_rights_first_security.sql` | `3ad31cbd638fada7efae8e71201d80283c4c2c5b` | Content rights records and rights audit log/indexes |
| 0007 | `0007_ai_author_studio.sql` | `3db09ab2988e93b21a1ce7fed4a17d9f6b88a176` | AI author projects, chapter jobs, generation runs, provider benchmarks and publish policies |
| 0008 | `0008_discovery_community.sql` | `21fd33c85e10d95b419f372953d3f5d057646a7c` | Request votes and request index |
| 0009 | `0009_catalog_filter_indexes.sql` | `b886472e9b63d6813cd1e6e645fdf6a275048bbd` | Reverse lookup indexes for genres/tags and unlocks |
| 0010 | `0010_catalog_sort_indexes.sql` | `454ee0ff7fa8f66c4980a704a8576f4daa1f1b59` | Published novel sort indexes |
| 0011 | `0011_author_applications.sql` | `69bafcc8f03f87e36ac70e293548f69528f34f35` | Author application table, state checks and indexes |
| 0012 | **Missing on reviewed ref** | n/a | 0014 and 0018 comments refer to this as owner of runtime community feature tables |
| 0013 | `0013_chapter_update_timestamps.sql` | `31729535656fbecfec7e93c9ae6cb08a010b5fe8` | Chapter updated_at backfill, triggers and index |
| 0014 | `0014_reader_engagement_metrics.sql` | `4d430ba370e8ed56b1cab4a0cc309531f88549aa` | Comment-only no-op slot; delegates community DDL to 0012 |
| 0015 | `0015_daily_view_analytics.sql` | `967c1dc0df9c620239d17531b7a39ed8639e545a` | Daily novel/chapter view request aggregates and indexes |
| 0016 | `0016_reading_positions.sql` | `62031dc11ff5b4c54526317c56185cebe132a0e4` | Per-user reading positions and index |
| 0017 | `0017_ten_point_ratings.sql` | `616bc90ff3069ebf52d93d381529f750750498a2` | Rebuild ratings table with integer 1–10 CHECK |
| 0018 | `0018_comment_reports.sql` | `86c384089ecb0b32e822f0dacb0dc76757fa97c4` | Comment-only no-op slot; delegates comment_reports to 0012 |

## 2. Migration-chain findings

### 2.1 Confirmed dependency ordering
- 0003 creates app_settings and the initial 1–5 ratings table.
- 0004 adds novels.publication_status.
- 0005 adds chapters.publication_status.
- 0010 therefore has its publication-status prerequisite when the complete available sequence is applied in order.
- 0013 therefore has its chapter publication-status prerequisite when the complete available sequence is applied in order.
- 0017 has its initial ratings table from 0003 when the complete available sequence is applied in order.

Do not describe these three dependencies as proven fresh-install failures. The exact full sequence has not yet been executed in an isolated SQLite/D1 fixture.

### 2.2 Confirmed ownership gap
The 0012 migration is absent from the reviewed directory, but 0014 and 0018 explicitly state that their community feature DDL is owned by 0012. Runtime helper code still creates a subset of those objects. This means migration history does not express the same schema contract as the runtime code.

### 2.3 Runtime duplication
The migration directory contains several structures also created or altered by runtime helpers:
- AI Author Studio: migration 0007 and ensureAuthorAISchema;
- publication/rights/chapter schema: migrations 0004/0005/0013 and ensurePublishingSchema;
- request votes: migration 0008 and runtime feature helper;
- ratings: migrations 0003/0017 and runtime core schema;
- connector events/import jobs/recommendations: migration 0002 and ensureOmniTables;
- daily analytics: migration 0015 and ensureViewAnalyticsSchema;
- comment likes/reactions/reports: candidate 0012 and runtime feature/engagement helpers.

The SQL and runtime definitions are not always structurally equivalent.

## 3. Candidate migration 0012

The branch `fix/community-schema-foundation-001` contains candidate migration 0012 (blob SHA `765a5ad7790181f22b41dedaa3ddb8b82d9e7b25`). It should be reviewed as a focused patch, not merged with the branch wholesale.

Review points:
- adds foreign keys to several interaction tables;
- enforces unique comment reports by user/comment;
- archives duplicate and orphan report rows before deleting them from the active table;
- cleans orphan comment likes, novel reactions and request votes;
- adds validation/cascade triggers for legacy tables;
- includes indexes for comment moderation/query patterns.

Required fixture cases:
1. clean database after 0001–0011;
2. existing runtime-created feature tables with no foreign keys;
3. duplicate comment reports;
4. orphaned comment reports;
5. orphaned comment likes;
6. orphaned novel reactions;
7. orphaned request votes;
8. repeated migration application;
9. interrupted migration recovery;
10. preservation and retrieval of archived report details.

The candidate migration's data cleanup must be measured and approved. A migration should not silently discard moderation history.

## 4. Test matrix (not yet executed)

| Test ID | Fixture | Action | Required result | Status |
|---|---|---|---|---|
| DB-001 | Empty SQLite DB | Apply all present migrations in lexical order | Every migration succeeds; full object inventory captured | Not run |
| DB-002 | Empty SQLite DB | Apply sequence with approved 0012 candidate | Same canonical schema as expected inventory | Blocked: 0012 not integrated |
| DB-003 | Legacy runtime-core schema | Apply approved additive upgrade set | Existing content and account data preserved | Not run |
| DB-004 | Runtime feature helper schema | Apply canonical community migration | No duplicate-column/table failure; constraints reconciled | Not run |
| DB-005 | Legacy duplicate reports | Apply 0012 candidate | Every archived record preserved; active table unique | Not run |
| DB-006 | Legacy orphan interactions | Apply 0012 candidate | Reconciled rows counted and preserved/removed per approved policy | Not run |
| DB-007 | Existing ratings 1–5 | Apply 0017 | All valid historical ratings retained; new constraint 1–10 | Not run |
| DB-008 | Existing runtime ratings 1–10 | Run upgrade logic | No destructive or duplicate rebuild | Not designed |
| DB-009 | Existing chapter schema with updated_at | Apply 0013 | No duplicate-column failure; triggers/indexes correct | Not run |
| DB-010 | Donations with normalized duplicate references | Create unique expression index | Duplicates surfaced for review; no financial record silently deleted | Not run |
| DB-011 | Existing OmniPortal tables with partial columns | Apply migrations | Deterministic success/failure; no catch-and-hide schema drift | Not run |
| DB-012 | Every supported baseline | Run application SQL smoke tests | No missing table/column/index errors | Not run |
| DB-013 | Disposable D1 | Apply approved migration set | Same schema and integrity behavior as SQLite fixture | Not run |
| DB-014 | Interrupted migration | Resume/retry according to platform behavior | Safe, observable recovery | Not run |

## 5. Required verification queries

The fixture test should capture at least:
- all table/index/trigger names and SQL from sqlite_master;
- PRAGMA table_info for every table;
- PRAGMA index_list and index_info;
- PRAGMA foreign_key_list;
- PRAGMA foreign_key_check;
- row counts for all user/content/financial/community tables before and after;
- ratings distribution before and after conversion;
- duplicate/orphan report archive counts;
- migration filenames and checksums;
- D1 migration history for disposable D1.

## 6. Explicit non-actions

- No migration file was created, removed or edited.
- Candidate 0012 was not copied or merged.
- No SQLite/D1 migration test was executed.
- No production D1 database was queried or modified.
- No Worker deployment was triggered.

## 7. Next gate

The next deliverable is a deterministic migration test harness and schema inventory generated from the selected canonical release branch. It must validate both clean installation and supported historic upgrade states before any migration repair is proposed for production.
