# Phase 01N.10 — Worker API Route and Authorization Inventory

Status: first-pass static source inventory completed. The dispatcher contains 97 explicit API path conditions in the inspected Worker source. The public client calls 50 distinct API path/query templates. This is a source map, not runtime test evidence.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Worker source: `src/index.js`, blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`
Client source: `public/app.js`, blob `e857029f17d6f6d44233031cdb2b1029a60f6ac9`

## 1. Dispatcher inventory

| Dispatcher classification | Conditions |
|---|---:|
| public-or-callee-review | 52 |
| admin-gated | 21 |
| session-gated | 24 |
| **Total explicit path conditions** | **97** |

The authorization label is intentionally conservative. When a route delegates to a helper, the helper must be inspected before concluding whether it is public, authenticated, author-gated or admin-gated. A method omitted from the condition is not evidence that every HTTP method is intentionally supported.

## 2. Explicit Worker API path/method inventory

| Path condition | Method observed | Authorization evidence on dispatcher line | Source line |
|---|---|---|---:|
| `/api/health` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 449 |
| `/api/agents` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 453 |
| `/api/admin/agents` | GET | admin role checked in branch | 454 |
| `/api/admin/agents/run` | POST | admin role checked in branch | 455 |
| `/api/taxonomy` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 456 |
| `/api/admin/taxonomy` | GET | admin role checked in branch | 457 |
| `/api/admin/taxonomy` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 458 |
| `/api/health` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 459 |
| `/api/auth/register` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 460 |
| `/api/auth/login` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 461 |
| `/api/auth/logout` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 462 |
| `/api/me` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 463 |
| `/api/config` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 464 |
| `/api/genres` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 465 |
| `/api/tags` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 466 |
| `/api/public-authors` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 467 |
| `/api/sources` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 472 |
| `/api/omni/status` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 473 |
| `/api/omni/search` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 474 |
| `/api/omni/resolve` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 475 |
| `/api/omni/import` | POST | authenticated session required in branch | 476 |
| `/api/omni/jobs` | GET | authenticated session required in branch | 477 |
| `/api/omni/smart-unlock` | dispatcher does not constrain method on this condition | authenticated session required in branch | 478 |
| `/api/formats` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 480 |
| `/api/chapter-engagement` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 481 |
| `/api/novel-engagement` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 491 |
| `/api/platform/overview` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 508 |
| `/api/discovery/graph` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 574 |
| `/api/novels` | dispatcher does not constrain method on this condition | no explicit role helper visible on dispatcher line; inspect callee/handler | 587 |
| `/api/bookmark` | POST | authenticated session required in branch | 604 |
| `/api/history` | GET | authenticated session required in branch | 605 |
| `/api/history` | POST | authenticated session required in branch | 606 |
| `/api/reading-position` | GET | authenticated session required in branch | 607 |
| `/api/reading-position` | POST | authenticated session required in branch | 608 |
| `/api/library` | GET | authenticated session required in branch | 609 |
| `/api/library` | POST | authenticated session required in branch | 610 |
| `/api/bookmarks` | GET | authenticated session required in branch | 611 |
| `/api/novel-reactions` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 612 |
| `/api/novel-reactions` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 614 |
| `/api/comments` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 616 |
| `/api/comments` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 618 |
| `/api/comments/like` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 620 |
| `/api/comments/report` | POST | authenticated session required in branch | 622 |
| `/api/rating` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 623 |
| `/api/rating` | POST | authenticated session required in branch | 624 |
| `/api/admin/community/comments` | GET | admin role checked in branch | 625 |
| `/api/admin/community/comments` | PATCH | admin role checked in branch | 626 |
| `/api/admin/community/reports` | GET | admin role checked in branch | 627 |
| `/api/admin/community/reports` | PATCH | admin role checked in branch | 628 |
| `/api/donations` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 630 |
| `/api/payment/webhook` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 647 |
| `/api/requests` | POST | authenticated session required in branch | 648 |
| `/api/requests` | GET | authenticated session required in branch | 649 |
| `/api/follow` | POST | authenticated session required in branch | 650 |
| `/api/leaderboard` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 651 |
| `/api/tier-list` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 659 |
| `/api/random` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 664 |
| `/api/made-for-you` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 668 |
| `/api/vote-novels` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 676 |
| `/api/vote-novels` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 680 |
| `/api/notifications` | GET | authenticated session required in branch | 687 |
| `/api/notifications/read` | POST | authenticated session required in branch | 688 |
| `/api/report` | POST | authenticated session required in branch | 689 |
| `/api/tickets/ledger` | GET | authenticated session required in branch | 690 |
| `/api/recommendations` | GET | authenticated session required in branch | 691 |
| `/api/follows` | GET | authenticated session required in branch | 692 |
| `/api/profile` | GET | authenticated session required in branch | 693 |
| `/api/author/applications/me` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 694 |
| `/api/author/applications` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 700 |
| `/api/admin/author-applications` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 716 |
| `/api/admin/stats` | dispatcher does not constrain method on this condition | admin role checked in branch | 745 |
| `/api/admin/users` | GET | admin role checked in branch | 746 |
| `/api/author/ai/status` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 750 |
| `/api/author/ai/projects` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 754 |
| `/api/author/ai/projects` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 758 |
| `/api/author/ai/benchmarks` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 825 |
| `/api/author/ai/benchmarks` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 831 |
| `/api/author/analytics` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 836 |
| `/api/author/novels` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 879 |
| `/api/author/novels` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 883 |
| `/api/author/chapters` | GET | no explicit role helper visible on dispatcher line; inspect callee/handler | 911 |
| `/api/author/chapters` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 915 |
| `/api/admin/publishing` | GET | admin role checked in branch | 935 |
| `/api/admin/publishing/novels` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 936 |
| `/api/admin/publishing/chapters/reorder` | POST | admin role checked in branch | 983 |
| `/api/admin/publishing/chapters` | POST | admin role checked in branch | 998 |
| `/api/admin/donations` | GET | admin role checked in branch | 999 |
| `/api/admin/reports` | GET | admin role checked in branch | 1001 |
| `/api/admin/tickets` | POST | admin role checked in branch | 1003 |
| `/api/admin/connectors` | GET | admin role checked in branch | 1004 |
| `/api/admin/connectors` | PATCH | admin role checked in branch | 1005 |
| `/api/admin/omni/health` | POST | admin role checked in branch | 1006 |
| `/api/admin/connectors/cleanup` | POST | no explicit role helper visible on dispatcher line; inspect callee/handler | 1007 |
| `/api/connector-authorization-requests` | POST | authenticated session required in branch | 1027 |
| `/api/admin/connectors` | POST | admin role checked in branch | 1028 |
| `/api/admin/requests` | GET | admin role checked in branch | 1029 |
| `/api/admin/connector-authorization-requests` | GET | admin role checked in branch | 1031 |

## 3. Client API path/query templates

- `/api/auth/`
- `/api/auth/logout`
- `/api/author/analytics?days=`
- `/api/author/applications`
- `/api/author/applications/me`
- `/api/author/chapters`
- `/api/author/novels`
- `/api/author/novels/`
- `/api/bookmark`
- `/api/bookmarks`
- `/api/chapter-engagement?chapter_id=`
- `/api/chapters/`
- `/api/discovery/graph?limit=60`
- `/api/follow`
- `/api/follows`
- `/api/formats`
- `/api/genres`
- `/api/health`
- `/api/history`
- `/api/leaderboard?period=`
- `/api/library`
- `/api/made-for-you`
- `/api/me`
- `/api/notifications`
- `/api/notifications/read`
- `/api/novel-engagement?novel_id=`
- `/api/novels/`
- `/api/novels?`
- `/api/novels?author=`
- `/api/novels?kind=`
- `/api/novels?q=`
- `/api/novels?sort=trending&limit=10`
- `/api/novels?sort=trending&limit=12`
- `/api/novels?sort=trending&limit=24`
- `/api/novels?sort=trending&limit=50`
- `/api/novels?sort=updated&limit=10`
- `/api/omni/import`
- `/api/omni/search?q=`
- `/api/omni/status`
- `/api/platform/overview`
- `/api/profile`
- `/api/random`
- `/api/reading-position`
- `/api/reading-position?novel_id=`
- `/api/recommendations`
- `/api/requests`
- `/api/tags`
- `/api/tickets/ledger`
- `/api/tier-list`
- `/api/vote-novels`

These are literal client call templates. Dynamic path suffixes, query parameter combinations and helper-generated requests may not be fully represented by this simple extraction.

## 4. Confirmed user-owned data patterns

The inspected Worker SQL shows the following important account scoping patterns:

- Reading history selects by `history.user_id = current user id`.
- Reading position reads/writes require a session and use the current user identity.
- Library rows are selected by `library.user_id = current user id`.
- Bookmarks are selected by `bookmarks.user_id = current user id`.
- Notifications are selected and marked read using the current user id.
- Crown ledger reads filter by `ticket_ledger.user_id = current user id`.
- Follows are selected by `follows.user_id = current user id`.
- OmniPortal import jobs are selected by `import_jobs.user_id = current user id`.
- Profile aggregates are computed using the current user id.
- Recommendations are behind a session requirement.

This is positive source evidence for those paths, not proof that every related write path or every object reference is isolated. Two-account negative tests remain necessary.

## 5. Important audit flags found during inventory

1. `/api/admin/taxonomy` POST delegates to `adminTaxonomy()`; inspect the callee rather than treating the dispatcher line as the gate.
2. Author routes use helper/delegated handler patterns in several places. Verify every handler calls `author(u)` and checks the novel/chapter owner, not merely the role.
3. `/api/vote-novels` POST and public community mutations require closer review for identity, duplicate voting and abuse controls.
4. `/api/comments`, `/api/comments/like`, `/api/novel-reactions` and related handlers must be reviewed for rate limits, user identity and duplicate interaction behavior.
5. `/api/admin/publishing/novels` and several admin mutations delegate or continue into multiline blocks; inspect the complete branch for role gate and validation.
6. Routes whose dispatcher condition does not constrain the method need explicit method-not-allowed review.
7. The client contains additional endpoints such as chapter detail, unlock, auth and author nested paths that are composed from dynamic IDs; verify these against exact Worker patterns.
8. Static inspection does not establish response cache headers, CSRF posture, request-body limits, idempotency or runtime behavior.

## 6. Next audit slices

- [ ] Inspect all author endpoints from application lookup through chapter creation/editing, including ownership predicates.
- [ ] Inspect novel/chapter detail, unlock, bookmark and reader event methods.
- [ ] Inspect community comments, likes, reports, reactions, ratings and votes.
- [ ] Inspect every admin multiline handler and delegated helper.
- [ ] Build endpoint request/response field schemas.
- [ ] Map each route record to exact API family and permission policy.
- [ ] Add negative cross-account tests and execute the test suite in a runnable checkout.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.
