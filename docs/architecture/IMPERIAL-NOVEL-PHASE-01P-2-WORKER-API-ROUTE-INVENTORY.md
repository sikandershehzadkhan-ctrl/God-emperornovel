# Imperial Novel | Phase 01P.2: Worker API Route Inventory

**Branch:** `architecture/phase-01m-screen-blueprint`  
**Source:** `src/index.js`, inspected at 1,058 lines.  
**Status:** Static source index, not runtime verification.

## Extraction notes
The Worker routes `/api/*` to `api(req, env)`. The dispatcher combines exact path comparisons, dynamic regular expressions, prefix checks and helper-dispatched handlers. Rows below represent source predicate lines, not one normalized row per HTTP operation. Authorization may be inside helpers; a guard not visible on a predicate line does not prove public access.

## Predicate-line index

| Line | API literals (abbreviated) | Method | Coarse guard visible |
|---:|---|---|---|
| 449 | /api/health | GET | not visible here |
| 453 | /api/agents | GET | not visible here |
| 454 | /api/admin/agents | GET | admin(u) |
| 455 | /api/admin/agents/run | POST | admin(u) |
| 456 | /api/taxonomy | see handler | not visible here |
| 457 | /api/admin/taxonomy | GET | admin(u) |
| 458 | /api/admin/taxonomy | POST | not visible here |
| 459 | /api/health | see handler | not visible here |
| 460 | /api/auth/register | POST | not visible here |
| 461 | /api/auth/login | POST | not visible here |
| 462 | /api/auth/logout | POST | not visible here |
| 463 | /api/me | see handler | not visible here |
| 464 | /api/config | see handler | not visible here |
| 465 | /api/genres | see handler | not visible here |
| 466 | /api/tags | see handler | not visible here |
| 467 | /api/public-authors | see handler | not visible here |
| 472 | /api/sources | see handler | not visible here |
| 473 | /api/omni/status | see handler | not visible here |
| 474 | /api/omni/search | see handler | not visible here |
| 475 | /api/omni/resolve | see handler | not visible here |
| 476 | /api/omni/import | POST | need(u) |
| 477 | /api/omni/jobs | GET | need(u) |
| 478 | /api/omni/smart-unlock | see handler | need(u) |
| 480 | /api/formats | GET | not visible here |
| 481 | /api/chapter-engagement | GET | not visible here |
| 491 | /api/novel-engagement | GET | not visible here |
| 508 | /api/platform/overview | GET | not visible here |
| 574 | /api/discovery/graph | GET | not visible here |
| 587 | /api/novels | see handler | not visible here |
| 600 | dynamic/helper | see handler | not visible here |
| 601 | dynamic/helper | see handler | not visible here |
| 602 | dynamic/helper | POST | need(u) |
| 603 | dynamic/helper | POST | need(u) |
| 604 | /api/bookmark | POST | need(u) |
| 605 | /api/history | GET | need(u) |
| 606 | /api/history | POST | need(u) |
| 607 | /api/reading-position | GET | need(u) |
| 608 | /api/reading-position | POST | need(u) |
| 609 | /api/library | GET | need(u) |
| 610 | /api/library | POST | need(u) |
| 611 | /api/bookmarks | GET | need(u) |
| 612 | /api/novel-reactions | GET | not visible here |
| 614 | /api/novel-reactions | POST | not visible here |
| 616 | /api/comments | GET | not visible here |
| 618 | /api/comments | POST | not visible here |
| 620 | /api/comments/like | POST | not visible here |
| 622 | /api/comments/report | POST | need(u) |
| 623 | /api/rating | GET | not visible here |
| 624 | /api/rating | POST | need(u) |
| 625 | /api/admin/community/comments | GET | admin(u) |
| 626 | /api/admin/community/comments | PATCH | admin(u) |
| 627 | /api/admin/community/reports | GET | admin(u) |
| 628 | /api/admin/community/reports | PATCH | admin(u) |
| 630 | /api/donations | POST | not visible here |
| 647 | /api/payment/webhook | POST | not visible here |
| 648 | /api/requests | POST | need(u) |
| 649 | /api/requests | GET | need(u) |
| 650 | /api/follow | POST | need(u) |
| 651 | /api/leaderboard | GET | not visible here |
| 659 | /api/tier-list | GET | not visible here |
| 664 | /api/random | GET | not visible here |
| 668 | /api/made-for-you | GET | not visible here |
| 676 | /api/vote-novels | GET | not visible here |
| 680 | /api/vote-novels | POST | not visible here |
| 687 | /api/notifications | GET | need(u) |
| 688 | /api/notifications/read | POST | need(u) |
| 689 | /api/report | POST | need(u) |
| 690 | /api/tickets/ledger | GET | need(u) |
| 691 | /api/recommendations | GET | need(u) |
| 692 | /api/follows | GET | need(u) |
| 693 | /api/profile | GET | need(u) |
| 694 | /api/author/applications/me | GET | not visible here |
| 700 | /api/author/applications | POST | not visible here |
| 716 | /api/admin/author-applications | GET | not visible here |
| 745 | /api/admin/stats | see handler | admin(u) |
| 746 | /api/admin/users | GET | admin(u) |
| 747 | dynamic/helper | PATCH | admin(u) |
| 750 | /api/author/ai/status | GET | not visible here |
| 754 | /api/author/ai/projects | GET | not visible here |
| 758 | /api/author/ai/projects | POST | not visible here |
| 768 | dynamic/helper | see handler | not visible here |
| 781 | dynamic/helper | POST | not visible here |
| 792 | dynamic/helper | POST | not visible here |
| 821 | dynamic/helper | GET | not visible here |
| 825 | /api/author/ai/benchmarks | GET | not visible here |
| 831 | /api/author/ai/benchmarks | POST | not visible here |
| 836 | /api/author/analytics | GET | not visible here |
| 879 | /api/author/novels | GET | not visible here |
| 883 | /api/author/novels | POST | not visible here |
| 893 | dynamic/helper | POST | not visible here |
| 899 | dynamic/helper | PATCH | not visible here |
| 911 | /api/author/chapters | GET | not visible here |
| 915 | /api/author/chapters | POST | not visible here |
| 923 | dynamic/helper | PATCH | not visible here |
| 930 | dynamic/helper | POST | not visible here |
| 935 | /api/admin/publishing | GET | admin(u) |
| 936 | /api/admin/publishing/novels | POST | not visible here |
| 950 | dynamic/helper | PATCH | admin(u) |
| 951 | dynamic/helper | see handler | not visible here |
| 959 | dynamic/helper | see handler | not visible here |
| 983 | /api/admin/publishing/chapters/reorder | POST | admin(u) |
| 998 | /api/admin/publishing/chapters | POST | admin(u) |
| 999 | /api/admin/donations | GET | admin(u) |
| 1000 | dynamic/helper | PATCH | admin(u) |
| 1001 | /api/admin/reports | GET | admin(u) |
| 1002 | dynamic/helper | PATCH | admin(u) |
| 1003 | /api/admin/tickets | POST | admin(u) |
| 1004 | /api/admin/connectors | GET | admin(u) |
| 1005 | /api/admin/connectors | PATCH | admin(u) |
| 1006 | /api/admin/omni/health | POST | admin(u) |
| 1007 | /api/admin/connectors/cleanup | POST | not visible here |
| 1027 | /api/connector-authorization-requests | POST | need(u) |
| 1028 | /api/admin/connectors | POST | admin(u) |
| 1029 | /api/admin/requests | GET | admin(u) |
| 1030 | /api/admin/requests/ | PATCH | admin(u) |
| 1031 | /api/admin/connector-authorization-requests | GET | admin(u) |
| 1032 | dynamic/helper | PATCH | admin(u) |
| 1035 | dynamic/helper | see handler | not visible here |
| 1038 | dynamic/helper | see handler | not visible here |
| 1048 | dynamic/helper | see handler | not visible here |
| 1050 | dynamic/helper | see handler | not visible here |
| 1057 | dynamic/helper | see handler | not visible here |

## Route families present in the source

- Health, configuration, registration, login, logout and current-session identity.
- Public taxonomy, genres, tags, formats and author directory.
- OmniPortal source/status/search/resolve/import/jobs/smart-unlock and rights requests.
- Novel/chapter reads, chapter unlock and batch unlock.
- Bookmarks, history, reading positions, library, follows and notifications.
- Novel reactions, comments, likes, reports and ratings.
- Engagement aggregates, platform overview and discovery graph.
- Donations, payment webhook placeholder, requests, votes and ticket ledger.
- Author applications, author novels/chapters, analytics and AI project/job routes.
- Admin moderation, reports, publishing, users, donations, tickets, connectors, health, requests, taxonomy and agents.

## Normalization and security gates

Before implementation, split every nested condition into one operation per row, enumerate all HTTP methods, normalize dynamic IDs to route templates, identify helper symbols, and verify owner predicates and guards inside each helper. Record request/response classification, side effects, transaction boundaries, audit, rate limits, idempotency, cache policy and positive/negative/cross-owner tests.

The inventory is not exhaustive at the normalized operation level and does not establish production behavior. It does not change application code, permissions, roles, schema, production data, Worker settings or deployment.
