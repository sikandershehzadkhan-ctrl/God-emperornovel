# Imperial Novel | Phase 01P.5: Normalized API Operation Registry

**Branch:** `architecture/phase-01m-screen-blueprint`  
**Source audited:** `src/index.js`, 1,058 lines, SHA `13874ee0fde4e31e04a652c5169776c3b6f95c38`.  
**Method:** Static inspection of API dispatch predicates and visible handler bodies.  
**Status:** Partial normalized registry. This is deliberately **not labelled exhaustive**: delegated helper internals, route branches hidden in multiline blocks, dynamic IDs, method fall-through and imported functions require a second source pass and executable route tests.

## 1. Reading this registry

- “Observed method” means an explicit method comparison appears in the dispatch predicate.
- “No method predicate” means this source branch is selected without a visible method comparison. It does **not** prove all methods are intentionally supported; verify the handler and response behavior.
- “Delegated” means control passes to a helper whose complete internal dispatch contract is not established by this row.
- “Guard” records only the visible coarse guard. `need(u)` means authenticated session; `admin(u)` means current coarse admin role; `author(u)` means current coarse author/admin guard. “None visible” is not a proof of public access if nested helper logic exists.
- Proposed permissions are target architecture vocabulary, not current runtime permissions.
- Risk: P0 critical, P1 high, P2 moderate, P3 low.
- Every source line refers to the audited source SHA above, not a moving line number on main.

## 2. Normalized operations

| ID | Method | Path / pattern | Source | Current guard / observed behavior | Proposed permission | Risk |
|---|---|---|---:|---|---|---|
| API-001 | GET | `/api/health` | 449,459 | None visible; duplicate health branch | `system.health.read` | P2 |
| API-002 | GET | `/api/agents` | 453 | None visible; enabled agent metadata | `agent.catalog.read` | P2 |
| API-003 | GET | `/api/admin/agents` | 454 | admin | `agent.admin.read` | P1 |
| API-004 | POST | `/api/admin/agents/run` | 455 | admin; runs slug or automation | `agent.run` scoped capability | P0 |
| API-005 | delegated | `/api/taxonomy` | 456 | `communityTaxonomy(req,env)`; helper owns method handling | `taxonomy.read` / `taxonomy.submit` | P1 |
| API-006 | GET | `/api/admin/taxonomy` | 457 | admin | `taxonomy.review.read` | P1 |
| API-007 | POST | `/api/admin/taxonomy` | 458 | delegated to `adminTaxonomy(req,env,u)` | `taxonomy.review.decide` | P1 |
| API-008 | POST | `/api/auth/register` | 460 | IP rate limit; public registration | `identity.register` | P1 |
| API-009 | POST | `/api/auth/login` | 461 | IP and email rate limits | `identity.authenticate` | P0 |
| API-010 | POST | `/api/auth/logout` | 462 | Deletes presented session token hash; no explicit need guard | `identity.session.revoke.self` | P1 |
| API-011 | no method predicate | `/api/me` | 463 | Returns current user or null | `identity.self.read` | P2 |
| API-012 | no method predicate | `/api/config` | 464 | Public config; payment explicitly disabled | `platform.config.read` | P2 |
| API-013 | no method predicate | `/api/genres` | 465 | Public taxonomy read | `catalog.genre.read` | P3 |
| API-014 | no method predicate | `/api/tags` | 466 | Public taxonomy read | `catalog.tag.read` | P3 |
| API-015 | no method predicate | `/api/public-authors` | 467-471 | Public-author handler block; inspect nested query/filters | `author.profile.public.read` | P2 |
| API-016 | no method predicate | `/api/sources` | 472 | Public source registry metadata | `omni.source_registry.read` | P2 |
| API-017 | no method predicate | `/api/omni/status` | 473 | Public status; returns connector metadata after redacting some URLs | `omni.status.read` | P1 |
| API-018 | no method predicate | `/api/omni/search` | 474 | Public federated search; provider allowlist and rights status checked | `omni.search` | P1 |
| API-019 | no method predicate | `/api/omni/resolve` | 475 | Public URL/source resolution | `omni.source.resolve` | P1 |
| API-020 | POST | `/api/omni/import` | 476 | need; requires enabled rights-authorized provider and metadata permission | `omni.metadata.import` | P0 |
| API-021 | GET | `/api/omni/jobs` | 477 | need; query bound to `u.id` | `omni.jobs.self.read` | P1 |
| API-022 | no method predicate | `/api/omni/smart-unlock` | 478 | need; calculates options for current user's tickets | `commerce.unlock.quote` | P1 |
| API-023 | GET | `/api/formats` | 480 | Public format registry | `catalog.format.read` | P3 |
| API-024 | GET | `/api/chapter-engagement` | 481-490 | Public aggregate handler; inspect privacy thresholds | `engagement.chapter.aggregate.read` | P2 |
| API-025 | GET | `/api/novel-engagement` | 491-507 | Public aggregate handler; inspect privacy thresholds | `engagement.novel.aggregate.read` | P2 |
| API-026 | GET | `/api/platform/overview` | 508-573 | Public overview branch; inspect aggregate disclosure | `platform.overview.public.read` | P1 |
| API-027 | GET | `/api/discovery/graph` | 574-586 | Public graph handler | `discovery.graph.read` | P2 |
| API-028 | route-dependent | `/api/novels` | 587-603 | Method branching inside handler; normalize nested GET/POST/etc separately after full block inspection | `catalog.novel.read` / `author.novel.create` | P1 |
| API-029 | POST | `/api/bookmark` | 604 | need; uses session user ID; validates published chapter | `library.bookmark.write.self` | P2 |
| API-030 | GET | `/api/history` | 605 | need; query bound to `u.id` | `library.history.read.self` | P1 |
| API-031 | POST | `/api/history` | 606 | need; inserts under `u.id`; validates published chapter | `library.history.write.self` | P2 |
| API-032 | GET | `/api/reading-position` | 607 | need; reads by `u.id` plus novel/chapter | `reader.progress.read.self` | P1 |
| API-033 | POST | `/api/reading-position` | 608 | need; validates percentage and published chapter | `reader.progress.write.self` | P1 |
| API-034 | GET | `/api/library` | 609 | need; query bound to `u.id` | `library.collection.read.self` | P1 |
| API-035 | POST | `/api/library` | 610 | need; toggles current user's library entry | `library.collection.write.self` | P2 |
| API-036 | GET | `/api/bookmarks` | 611 | need; query bound to `u.id` | `library.bookmark.read.self` | P2 |
| API-037 | GET | `/api/novel-reactions` | 612-613 | nested handler; inspect query/user scoping | `engagement.reaction.read` | P2 |
| API-038 | POST | `/api/novel-reactions` | 614-615 | nested handler; inspect idempotency and ownership | `engagement.reaction.write.self` | P2 |
| API-039 | GET | `/api/comments` | 616-617 | nested handler; inspect publication/visibility filters | `community.comment.read` | P2 |
| API-040 | POST | `/api/comments` | 618-619 | nested handler; inspect author identity and rate limit | `community.comment.create.self` | P1 |
| API-041 | POST | `/api/comments/like` | 620-621 | nested handler; inspect target visibility and uniqueness | `community.comment.react.self` | P2 |
| API-042 | POST | `/api/comments/report` | 622 | need; validates reason and visible comment | `community.report.create.self` | P1 |
| API-043 | GET | `/api/rating` | 623 | Public; validates published novel; optional current-user rating | `catalog.rating.aggregate.read` | P2 |
| API-044 | POST | `/api/rating` | 624 | need; uses `parseNovelRating`; integer 1-10 target | `catalog.rating.write.self` | P1 |
| API-045 | GET | `/api/admin/community/comments` | 625 | admin | `community.moderation.queue.read` | P1 |
| API-046 | PATCH | `/api/admin/community/comments` | 626 | admin; status transition plus batch/audit logic | `community.moderation.comment.decide` | P0 |
| API-047 | GET | `/api/admin/community/reports` | 627 | admin; report data includes related content/user fields | `community.moderation.report.read` | P1 |
| API-048 | PATCH | `/api/admin/community/reports` | 628 | admin; status transition plus batch/audit logic | `community.moderation.report.decide` | P0 |
| API-049 | POST | `/api/donations` | 630-646 | nested block; verify validation, reference uniqueness and pending-only state | `commerce.donation.submit.self` | P0 |
| API-050 | POST | `/api/payment/webhook` | 647 | currently hard-disabled with 503 | `commerce.payment.webhook.verify` | P0 |
| API-051 | POST | `/api/requests` | 648 | need; HTTPS and source-host validation; creates paid/free request | `catalog.request.create.self` | P1 |
| API-052 | GET | `/api/requests` | 649 | need; count for current user | `catalog.request.quota.read.self` | P2 |
| API-053 | POST | `/api/follow` | 650 | need; current user follows/unfollows published novel | `library.follow.write.self` | P2 |
| API-054 | GET | `/api/leaderboard` | 651-658 | Public ranking handler | `discovery.ranking.read` | P2 |
| API-055 | GET | `/api/tier-list` | 659-663 | Public tier list handler | `discovery.tier_list.read` | P2 |
| API-056 | GET | `/api/random` | 664-667 | Public random discovery | `discovery.random.read` | P3 |
| API-057 | GET | `/api/made-for-you` | 668-675 | Public/personalization behavior requires privacy review | `discovery.recommendation.read` | P1 |
| API-058 | GET | `/api/vote-novels` | 676-679 | Public voting data read | `community.vote.read` | P2 |
| API-059 | POST | `/api/vote-novels` | 680-686 | nested write; inspect auth, uniqueness and rate limits | `community.vote.write.self` | P1 |
| API-060 | GET | `/api/notifications` | 687 | need; query bound to `u.id` | `identity.notification.read.self` | P1 |
| API-061 | POST | `/api/notifications/read` | 688 | need; marks current user's unread notifications | `identity.notification.mark_read.self` | P2 |
| API-062 | POST | `/api/report` | 689 | need; creates general report; target ID validation needs review | `trust.report.create.self` | P1 |
| API-063 | GET | `/api/tickets/ledger` | 690 | need; query bound to `u.id` | `commerce.ledger.read.self` | P0 |
| API-064 | GET | `/api/recommendations` | 691 | need; personalized rows bound to `u.id` | `discovery.recommendation.read.self` | P2 |
| API-065 | GET | `/api/follows` | 692 | need; query bound to `u.id` | `library.follow.read.self` | P2 |
| API-066 | GET | `/api/profile` | 693 | need; current account and personal stats | `identity.profile.read.self` | P1 |
| API-067 | GET | `/api/author/applications/me` | 694-699 | inspect nested branch; self application | `author.application.read.self` | P2 |
| API-068 | POST | `/api/author/applications` | 700-715 | inspect nested branch; application create/update | `author.application.submit.self` | P1 |
| API-069 | GET | `/api/admin/author-applications` | 716-722 | admin guard expected within block; verify exact branch | `author.application.review.read` | P1 |
| API-070 | PATCH? | `/api/admin/author-applications/:id` | 723-744 | dynamic ID parsed; method/guard must be confirmed in complete block | `author.application.review.decide` | P0 |
| API-071 | no method predicate | `/api/admin/stats` | 745 | admin; aggregate operational stats | `admin.analytics.read` | P1 |
| API-072 | GET | `/api/admin/users` | 746-749 | admin; user directory fields | `identity.admin.user.read` | P1 |
| API-073 | GET | `/api/author/ai/status` | 750-753 | inspect handler; author eligibility and provider status | `author.ai.status.read` | P1 |
| API-074 | GET | `/api/author/ai/projects` | 754-757 | inspect owner scoping | `author.ai.project.read.own` | P1 |
| API-075 | POST | `/api/author/ai/projects` | 758-824 | inspect validation, owner assignment, external calls and side effects | `author.ai.project.create` | P0 |
| API-076 | GET | `/api/author/ai/benchmarks` | 825-830 | inspect visibility and data ownership | `author.ai.benchmark.read` | P2 |
| API-077 | POST | `/api/author/ai/benchmarks` | 831-835 | inspect author guard and write ownership | `author.ai.benchmark.create` | P1 |
| API-078 | GET | `/api/author/analytics` | 836-878 | inspect owner scope and private metrics | `author.analytics.read.own` | P1 |
| API-079 | GET | `/api/author/novels` | 879-882 | inspect author scope | `author.novel.read.own` | P1 |
| API-080 | POST | `/api/author/novels` | 883-910 | inspect author guard, rights fields and ownership assignment | `author.novel.create` | P0 |
| API-081 | GET | `/api/author/chapters` | 911-914 | inspect parent ownership | `author.chapter.read.own` | P1 |
| API-082 | POST | `/api/author/chapters` | 915-934 | inspect parent ownership, rights and publication state | `author.chapter.create` | P0 |
| API-083 | GET | `/api/admin/publishing` | 935 | admin | `publishing.queue.read` | P1 |
| API-084 | POST | `/api/admin/publishing/novels` | 936-982 | admin; publishing workflow, rights checks require detailed state audit | `publishing.novel.decide` | P0 |
| API-085 | POST | `/api/admin/publishing/chapters/reorder` | 983-997 | admin; dynamic chapter/parent relationships | `publishing.chapter.reorder` | P0 |
| API-086 | POST | `/api/admin/publishing/chapters` | 998 | admin; creates chapter; rights check visible for published novel | `publishing.chapter.create` | P0 |
| API-087 | GET | `/api/admin/donations` | 999-1000 | admin; donation and user details | `finance.donation.queue.read` | P0 |
| API-088 | GET | `/api/admin/reports` | 1001-1002 | admin; report data | `trust.report.queue.read` | P1 |
| API-089 | POST | `/api/admin/tickets` | 1003 | admin; direct balance increment and ledger insertion | `finance.ticket.adjust.request` plus independent approval | P0 |
| API-090 | GET | `/api/admin/connectors` | 1004 | admin; SELECT includes auth_header and secret_name; response redaction must be confirmed | `provider.config.read` with secret redaction | P0 |
| API-091 | PATCH | `/api/admin/connectors` | 1005 | admin; updates connector and rights metadata | `provider.config.update` / `rights.status.decide` separated | P0 |
| API-092 | POST | `/api/admin/omni/health` | 1006 | admin; probes enabled authorized connectors | `provider.health.check` | P1 |
| API-093 | POST | `/api/admin/connectors/cleanup` | 1007-1026 | admin guard in branch; cleanup side effects need exact retention review | `provider.registry.cleanup` | P0 |
| API-094 | POST | `/api/connector-authorization-requests` | 1027 | need; submits rights evidence request | `rights.authorization.request.self` | P1 |
| API-095 | POST | `/api/admin/connectors` | 1028 | admin; creates disabled connector, but sets rights_status='authorized' in insert | `provider.registry.create` and separate rights decision | P0 |
| API-096 | GET | `/api/admin/requests` | 1029 | admin; request queue | `catalog.request.review.read` | P1 |
| API-097 | PATCH | `/api/admin/requests/:id` | 1030 | admin; status transitions and possible ticket refund/charge logic | `catalog.request.review.decide` plus finance approval where applicable | P0 |
| API-098 | GET | `/api/admin/connector-authorization-requests` | 1031 | admin; rights request queue | `rights.authorization.review.read` | P0 |

## 3. Method and dispatch caveats

1. The dispatcher begins by normalizing the request path and method, then invokes the API handler for paths beginning `/api/`. The Worker fallback itself is not a complete API registry.
2. Several branches have no explicit method predicate. This is a code-level observation, not an endorsement. A follow-up must determine whether they should be GET-only and add 405 behavior.
3. `/api/taxonomy` and `/api/admin/taxonomy` delegate to helpers. Their methods and exact guards must be read from helper bodies.
4. `/api/novels`, community, donation, application, AI and admin publishing blocks contain nested or multiline logic. The table intentionally flags these for method/guard confirmation where the dispatch line alone is insufficient.
5. The dynamic author-application review path is parsed by prefix and numeric suffix. The precise method guard and role guard must be captured from the surrounding block, not guessed.
6. Additional route operations may exist in imported modules or helper dispatchers. This inventory only covers visible source branches captured above.

## 4. Required helper and block follow-up

| Helper/block | Required inspection | Why it matters |
|---|---|---|
| `communityTaxonomy(req,env)` | Every supported method, write guard, validation, rate limit | Delegated public taxonomy route |
| `adminTaxonomy(req,env,u)` | Method, admin/permission guard, audit and status transitions | Staff write boundary |
| Public authors block | Query filters and private-field minimization | Public data leakage |
| Chapter/novel engagement blocks | Aggregate thresholds and user-level leakage | Reading privacy |
| `/api/novels` block | Every method, draft visibility and ownership | Catalog/author boundary |
| Reactions/comments/votes | Full method and nested authorization | Community abuse/IDOR |
| Donations block | Reference uniqueness, amount, state transitions, idempotency | Financial correctness |
| Author applications | Self ownership and reviewer separation | Privilege escalation |
| Author AI project block | Every operation, owner predicate, provider/key behavior | Private project and spend protection |
| Author analytics | Query scoping, public/private metric separation | Author data confidentiality |
| Admin publishing blocks | All methods, rights checks, chapter-parent validation, audit | Content rights and publication integrity |
| Connector cleanup | Deletion/merge/archive behavior and audit | Provider registry integrity |
| Connector authorization review | Decision method, requester conflict, audit | Rights independence |

## 5. Immediate P0 test mapping

| Test family | Registry IDs | Minimum direct API tests |
|---|---|---|
| Session/auth | API-008 to API-011 | No session, stale session, rate limit, logout replay |
| Agent execution | API-004 | Unknown slug, cross-scope action, replay, arbitrary body |
| Omni import/providers | API-017 to API-020, API-090 to API-095 | Disabled provider, no rights, SSRF, secret leakage, unauthorized import |
| User-owned resources | API-021, API-029 to API-036, API-060 to API-066 | Forged owner ID, cross-account reads, cache isolation |
| Ratings/community | API-037 to API-048, API-058 to API-059 | Invalid rating, duplicate reaction, report IDOR, moderator scope |
| Commerce | API-049 to API-052, API-063, API-087, API-089, API-097 | Duplicate reference, replay, concurrent approval, ledger atomicity |
| Author/publishing | API-067 to API-086 | Cross-author project/novel/chapter IDs, rights state, self-approval |
| Staff operations | API-003 to API-007, API-045 to API-048, API-071 to API-072, API-083 to API-098 | Non-admin denial, scoped permissions, audit fail-closed |

## 6. Gaps and confidence

- **High confidence:** rows where exact path, explicit method and visible coarse guard are on the same source line.
- **Medium confidence:** exact path is visible but handler logic is multiline or nested.
- **Low confidence / unresolved:** delegated helpers, dynamic method dispatch, source branches not yet fully inspected.
- No claim is made that 98 rows represent 98 unique deployed endpoint URLs; rows represent normalized operations and candidate operations where method dispatch is still marked unresolved.
- A production-facing route registry must add request/response schemas, data classification, side effects, idempotency, rate-limit class, audit requirement and test IDs for each confirmed operation.

## 7. Exit criteria for Phase 01P.6

- Inspect helper implementations and every flagged block above.
- Confirm exact method for every operation; add explicit 405 behavior where appropriate.
- Inspect imported modules and all route handlers reachable from `api()`.
- Resolve whether the duplicate `/api/health` branch is dead/redundant.
- Add owner predicate and audit evidence for every sensitive operation.
- Reconcile operation IDs with Phase 01P.1 permission matrix and Phase 01P.3 test matrix.
- Generate a machine-checkable route registry only after the source inventory is complete.
- Update this document with a new source SHA if source changes.

## 8. Safety boundary

Architecture documentation only. No application source, migrations, database records, user roles, secrets, Cloudflare configuration, branch merge or deployment changed. No runtime security test was executed.
