# Phase 01N.12 — Reader and Community API Security Review

Status: static source review completed for chapter access/unlock, reader progress, bookmarks, library, reactions, comments, ratings, follows, votes, notifications and reports. No live requests or adversarial account tests were run.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Worker source: `src/index.js`, blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`

## 1. Reader content access

| Endpoint | Method | Gate / object check | Behavior |
|---|---|---|---|
| `/api/novels/:id` | GET | Published novel filter | Returns published chapters; optional signed-in bookmark/library/follow/rating state is queried by current user ID |
| `/api/chapters/:id` | GET | Parent novel and chapter both published | Locked content hidden unless free, admin, or current user has an unlock |
| `/api/chapters/:id/unlock` | POST | Authenticated; chapter and parent novel published | Validates price and balance; D1 batch debits, inserts unlock and ledger |
| `/api/novels/:id/batch-unlock` | POST | Authenticated; parent novel published | Batch sizes 10/25/50/100; filters already unlocked chapters; guarded debit/unlock/ledger/batch records |
| `/api/bookmark` | POST | Authenticated; chapter belongs to published novel | Upserts one bookmark per user/novel |
| `/api/history` | GET/POST | Authenticated; POST validates published novel/chapter | Reads/writes scoped by current user ID |
| `/api/reading-position` | GET/POST | Authenticated; POST validates IDs and progress 0–100 plus published chapter | Reads/writes scoped by current user |
| `/api/library` | GET/POST | Authenticated; POST validates published novel | Reads/toggle writes scoped by current user |
| `/api/bookmarks` | GET | Authenticated | Current user's bookmarks |
| `/api/follows` | GET | Authenticated | Current user's follows |
| `/api/follow` | POST | Authenticated; published novel | Toggle follow for current user |
| `/api/tickets/ledger` | GET | Authenticated | Ledger query filters by current user |

## 2. Community and engagement endpoints

| Endpoint | Method | Gate / validation | Behavior |
|---|---|---|---|
| `/api/novel-reactions` | GET | Public; published novel | Aggregate counts; optional current-user reaction |
| `/api/novel-reactions` | POST | Authenticated; reaction allow-list: love/fire/laugh/sad/clap | One reaction per user/novel via upsert; same reaction toggles off |
| `/api/comments` | GET | Public; published novel with eligible rights | Visible comments only; recent 300 plus parent rows; liked state uses current user ID |
| `/api/comments` | POST | Authenticated; text 1–1000 chars; parent must be visible top-level comment on same novel | Max 10 comments/user/hour; reply and novel owner notifications |
| `/api/comments/like` | POST | Authenticated; visible comment on published eligible novel | Toggle like scoped to current user |
| `/api/comments/report` | POST | Authenticated; reason allow-list; visible eligible target | Duplicate report blocked; max 10 reports/user/hour |
| `/api/rating` | GET | Public; published novel | Count, average, distribution and optional current-user rating |
| `/api/rating` | POST | Authenticated; rating parser validation | Upsert one rating per user/novel and recompute average |
| `/api/vote-novels` | GET | Public | Pending/approved requests and vote counts |
| `/api/vote-novels` | POST | Authenticated; request must be pending/approved | Toggle vote scoped to current user |
| `/api/notifications` | GET | Authenticated | Current user's latest 50 notifications |
| `/api/notifications/read` | POST | Authenticated | Marks only current user's unread notifications as read |
| `/api/report` | POST | Authenticated; reason 1–300 chars | Inserts generic report with caller-supplied novel/chapter IDs and details capped at 2,000 chars |

## 3. Positive controls observed

- Reader history, progress, bookmarks, library, follows, unlocks and ledger use the authenticated user ID in their SQL predicates.
- Chapter body is returned only when unlocked or not locked; a locked chapter response returns `content: null`.
- Unlock and batch unlock debit and ledger operations are guarded in a D1 batch; balance and duplicate unlock checks are present.
- Public comment reads expose visible comments; comment reports require a visible target on an eligible published novel.
- Comment creation and reporting have per-user hourly limits; duplicate comment reports are rejected.
- Comment moderation and report status transitions are admin-gated and audited in the previously inspected admin handler family.

## 4. Follow-up risks and questions

1. **Generic report target validation:** `POST /api/report` validates reason length but writes `novel_id` / `chapter_id` from the request body. This handler did not visibly validate target existence, publication state, chapter/novel relationship or report rate. Inspect schema constraints and add explicit validation/rate limits if absent.
2. **Vote uniqueness:** handler checks then inserts/deletes a vote. Confirm a unique database constraint on `(request_id,user_id)` to prevent concurrent duplicate votes.
3. **Reaction and rating uniqueness:** confirm unique constraints on `(user_id,novel_id)`; the upsert assumes them.
4. **Unlock batch atomicity:** add failure-injection tests proving no partial debit/unlock/ledger state.
5. **Reader progress references:** GET validates positive IDs but does not visibly verify that the novel/chapter pair exists or is published before returning a row/default. Confirm this cannot expose stale metadata.
6. **Comment abuse:** hourly limits are present, but no content moderation or spam classifier was confirmed in this endpoint pass.
7. **Public counters:** confirm rate limiting and cache behavior for aggregate endpoints.
8. **Generic report API:** do not assume it inherits the dedicated comment-report duplicate and rate limits.
9. **Two-account tests:** user A/B attempts for history, bookmarks, reading position, library, follows, unlocks, notifications and ledger must return only caller-owned records.
10. **Method/body handling:** test unsupported methods, malformed JSON, oversized bodies and unauthenticated POST attempts.

## 5. Schema evidence still required

The migration file paths for the relevant table definitions were not yet resolved in this pass. Therefore no unique-index, foreign-key or cascade guarantee is claimed for `request_votes`, `novel_reactions`, `ratings`, `unlocks`, `comment_likes`, `comment_reports` or `reports`. Inspect the actual migration inventory before making those claims.

## 6. Phase 01N.12 disposition

- [x] Inspect chapter read and unlock paths.
- [x] Inspect batch unlock accounting.
- [x] Inspect history, progress, bookmarks and library.
- [x] Inspect reactions, comments, likes, reports and ratings.
- [x] Inspect request voting and notifications.
- [x] Record positive account-scoping predicates and follow-up risks.
- [ ] Inspect relevant migration constraints and indexes.
- [ ] Verify generic report target validation and rate limiting.
- [ ] Execute two-account isolation and concurrency tests.
- [ ] Add/execute failure-injection tests for unlock accounting.
- [ ] Complete route-level API schemas and permission mapping.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.
