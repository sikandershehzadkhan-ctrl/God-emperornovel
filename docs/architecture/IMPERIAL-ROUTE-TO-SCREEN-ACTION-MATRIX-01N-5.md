# Imperial Novel: Route-to-Screen-to-Action-to-Data Matrix

Status: architecture mapping based on source inspection; proposed routes are explicitly marked. This is not proof that every mapped screen or API is implemented.
Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`

## Mapping contract
Every routable feature must have: stable route ID; canonical URL and aliases; screen and shell; components; user actions; API method/path; owning domain and database entities; authorization rule; privacy/cache rule; analytics/realtime events; localization/SEO behavior; loading/empty/error states; positive and negative tests; status (observed, proposed, implemented, tested, production-verified).

## Route matching and canonicalization invariants
- Match exact/static routes before parameterized routes. `/novel/:id/chapters` must be resolved before `/novel/:id`.
- `/author` must be resolved before `/author/:username`.
- Preserve existing numeric identifiers and legacy URLs `/novel/:id`, `/novel/:id/chapters`, `/read/:id/:chapter`; do not break bookmarks or external links.
- `/discover` and `/catalog` currently converge on a catalog shell; canonical URL decision remains open.
- `/for-you` and `/made-for-you` overlap; choose one canonical route and redirect aliases only after compatibility checks.
- `/omniportal` is the observed spelling. `/omni-portal` is a proposed alias/migration, not a current route.
- Unknown routes must return a real HTTP 404 status, not merely render a 404-looking page with status 200.
- Normalize trailing slashes, case policy, encoded path segments and query parameters consistently. Reject malformed IDs and path traversal sequences.

## Public discovery and content routes
| Route / state | Status | Screen and key components | Actions and API contracts | Data and authorization | Required tests |
|---|---|---|---|---|---|
| `/` | Observed | Home; hero, featured shelves, updates, genres, format cards, platform pulse | Browse links; public catalog/discovery endpoints | Published catalog only; anonymous read | Shell loads; empty catalog; API outage fallback; no fabricated counts |
| `/discover` | Proposed alias | Discovery hub; curated shelves, filters, editorial modules | Browse/filter; catalog/search APIs | Public published metadata | Canonical redirect and query preservation |
| `/catalog` | Observed | Catalog; search/filter form, sort, status, genre, tag, author, pagination | GET catalog API (exact handler/method to verify) | Public published novels; bounded pagination | Invalid filters, pagination cap, query preservation, no draft leakage |
| `/catalog?sort=...&status=...&kind=...&genre=...&tag=...&author=...` | Observed query vocabulary | Same catalog screen with URL-driven state | Apply/reset filters | Public fields only | Allowed enum values, canonical query order, duplicate params |
| `/search?q=...` | Observed | Search results; query, result cards, filters | Search API; query suggestions proposed | Public indexed content only | Injection, abuse limits, empty/no-result, private draft exclusion |
| `/genres` | Observed | Genre directory | Select genre | Genre taxonomy and published counts | Unknown/empty genre handling |
| `/genres/:slug` | Proposed | Genre landing; description, subgenres, novel list | Filter catalog by genre | Public taxonomy and published works | Slug validation, canonical metadata, empty state |
| `/tags` | Observed | Tag directory | Select tag | Public tag taxonomy | Abuse/duplicate taxonomy tests |
| `/tags/:slug` | Proposed | Tag landing | Filter catalog by tag | Public taxonomy and published works | Slug validation and canonicalization |
| `/formats` | Observed/route target; source client has format directory | Format directory | Select format | Format taxonomy | Unknown format and empty state |
| `/format/:formatId` | Observed | Format landing | Browse matching catalog | Public format taxonomy | Unsupported ID, canonical metadata |
| `/trending` | Proposed dedicated canonical | Trending hub | Select time window; GET leaderboard/trending | Aggregated public engagement; anti-manipulation | Time-window boundaries, bot filtering, stale aggregate fallback |
| `/leaderboard` | Observed | Rankings | Select period; leaderboard API | Aggregated public metrics | Tie-breaking, manipulation, period validation |
| `/rankings` and `/rankings/:dimension` | Proposed | Rankings index and dimension pages | Sort/filter ranking | Public aggregates | Canonical route and consistent rank calculations |
| `/for-you` or `/made-for-you` | Alias conflict; `/made-for-you` observed | Personalized discovery | GET recommendations | Authenticated profile signals; anonymous fallback; never shared-cache | Cross-account isolation, consent, opt-out, failure fallback |
| `/tier-list` | Observed | Tier-list discovery | Load tiers | Public published ratings/activity | Rating manipulation, empty state |
| `/random` | Observed | Random discovery | Request random novel | Published eligible catalog | Never return drafts/removed content |
| `/novel/:id` | Observed | Novel detail; metadata, chapters, ratings, comments, engagement | GET novel; follow/rate/comment actions | Public published metadata; owner-only author mutations | IDOR, unpublished novel access, invalid ID, cache versioning |
| `/novel/:id/chapters` | Observed | Chapter archive; chapter list and status | GET novel/chapters | Public published chapter metadata; locked content policy | Route precedence, access state, pagination |
| `/read/:id/:chapter` | Observed | Immersive reader; chapter body, navigation, settings, progress | GET chapter; save reading position; engagement event | Published authorized chapter body; per-user progress private | Cross-user progress isolation, lock enforcement, cache correctness, offline/error behavior |
| `/random` | Observed | Random novel view | Random selection API | Published eligible catalog | Exclude hidden, deleted, unlicensed content |

## Identity, account and personal routes
| Route | Status | Screen and components | Actions / APIs | Data and authorization | Required tests |
|---|---|---|---|---|---|
| `/login` | Observed | Login form | Authenticate; session creation | Credentials/session secrets | Rate limit, generic errors, CSRF, session rotation |
| `/register` | Observed | Registration form | Create account, verify contact | Minimal identity data | Abuse throttles, duplicate-account privacy, verification |
| `/account` | Observed | Account overview | Read/update own profile | Self only | User A cannot read/update User B |
| `/user/:username` | Proposed | Public user profile | Follow/block/report where enabled | Explicitly public profile fields only | Private field exclusion, username changes, blocked visibility rules |
| `/settings` | Proposed canonical; settings screen observed in client | Preferences and privacy hub | Save preferences | Self only; device-only settings separated from server profile | CSRF, ownership, locale/theme persistence |
| `/settings/security` | Proposed | Password, MFA, sessions, recovery | Change password, enable MFA, revoke sessions | Self only; re-authentication required | Session invalidation, MFA recovery, no secret leakage |
| `/settings/privacy` | Proposed | Profile visibility, activity, personalization | Change privacy controls | Self only | Defaults, cache invalidation, downstream privacy propagation |
| `/settings/notifications` | Proposed | Notification preferences | Configure channels/types | Self only | Block rules respected; opt-out |
| `/settings/language` | Proposed | Language and locale | Change language | Self only | Locale fallback, RTL, translated routes |
| `/library` | Observed | Saved library | Add/remove/list saved novels | Self only | Cross-account IDOR, private cache disabled |
| `/history` | Observed | Reading history | View/delete own history | Self only | Cross-account isolation, deletion propagation |
| `/following` | Observed | Following list | Follow/unfollow/list | Self-owned relationship; public visibility policy | Block interaction, rate limit, private-list rules |
| `/notifications` | Observed | Notification inbox | Read/mark read/delete preferences | Recipient only | Recipient isolation, block/consent, replay |
| `/tickets` | Observed | Ticket wallet/ledger | View balance and ledger; request purchase | Self-only financial data | No cross-account ledger, immutable balance, duplicate events |
| `/requests` | Observed | Novel request board / personal requests | Create/vote/view own request state | Public request fields plus private owner metadata | Spam, ownership, voting uniqueness |
| `/vote` | Observed | Voting interface | Cast/change permitted vote | User identity; vote rules | Duplicate vote, race, manipulation |

## Author and creator routes
| Route | Status | Screen / components | Actions / APIs | Data and authorization | Required tests |
|---|---|---|---|---|---|
| `/become-an-author` | Observed | Creator landing and rights guidance | Apply for author access | Public program information; own application | Duplicate application, rights attestation |
| `/author` | Observed entry | Author Studio entry/dashboard | Load own workspace | Authenticated author; application status | Non-author denial; exact route before username route |
| `/author/:username` | Observed | Public author profile | Browse published works, follow/report if enabled | Public profile and published works | Draft exclusion, private identity exclusion |
| `/author/studio` | Proposed | Creator dashboard | List/manage own works | Author ownership | Direct URL authorization |
| `/author/studio/novels/new` | Proposed | Novel editor | Create draft | Authenticated author; server assigns owner | Cannot set another owner via payload |
| `/author/studio/novels/:novelId` | Proposed | Novel editor and metadata | Edit own draft | Owner or explicitly granted collaborator | IDOR, mass assignment, version conflict |
| `/author/studio/novels/:novelId/chapters/new` | Proposed | Chapter editor | Create draft chapter | Owner/collaborator with create scope | Owner binding, autosave isolation |
| `/author/studio/novels/:novelId/chapters/:chapterId` | Proposed | Chapter editor | Edit/save/preview | Explicit novel/chapter grant | Cross-novel IDOR, stale edit conflict |
| `/author/studio/analytics` | Proposed | Author analytics | Read own work metrics | Owner only; aggregate only | Other author metrics cannot be fetched by changing IDs |
| `/author/studio/rights` | Proposed | Rights declarations and evidence | Submit/update rights evidence | Work owner; restricted evidence | Private evidence access, audit trail |
| `/author/studio/collaborators` | Proposed | Collaborator manager | Invite, scope, revoke | Owner only; scoped grants | Cannot grant owner/admin, invitation expiry, revocation immediate |

## Community and safety routes
| Route | Status | Screen / components | Actions / APIs | Data and authorization | Required tests |
|---|---|---|---|---|---|
| `/community` | Observed | Community hub | Browse community modules | Public community content | Empty/error and moderation states |
| `/community-taxonomy` | Observed | Taxonomy/admin-support shell (purpose to confirm) | Browse/manage only if explicitly authorized | Taxonomy data; management requires scoped permission | Reader cannot mutate taxonomy |
| `/community/discussions` | Proposed | Discussion index | Browse/create | Public discussion fields; owner-scoped edit | Spam, ownership, moderation |
| `/community/discussions/:id` | Proposed | Discussion thread | Reply/report/react | Public thread; author-owned replies | Cross-user edit/delete denial |
| `/community/forums/:slug` | Proposed | Forum landing | Create topic if allowed | Membership/permission policy | Unauthorized posting and private forum access |
| `/community/reports` | Proposed restricted | Report centre | Submit/view own report status | Reporter and authorized moderation only | Reporter privacy, target cannot read reporter identity by default |
| `/user/:username/blocked` | Proposed private | Block management | Add/remove block | Self only | No public enumeration |
| `/moderation/queue` | Proposed restricted | Moderation work queue | Review/report action | Explicit moderation grant, least privilege | No blanket private-draft access; audit and appeal |

## OmniPortal, Trend Factory, admin and legal
| Route | Status | Screen / components | Actions / APIs | Data and authorization | Required tests |
|---|---|---|---|---|---|
| `/omniportal` | Observed | Rights-first provider gateway | View provider status/search approved metadata | Provider config restricted; connectors off until rights approval | Disabled-by-default, allowlist, no chapter-body ingestion |
| `/omniportal/providers` | Proposed | Provider directory | Inspect approved connectors | Public-safe metadata; operator config restricted | No secret exposure |
| `/omniportal/connections` | Proposed private | Connection management | Authorize/revoke provider connection | Account owner and scoped integration identity | Token isolation and revocation |
| `/trend-factory` | Observed | Trend intelligence dashboard | View signals, refresh/search metadata | Metadata/RSS/API only; no unauthorized chapter ingestion | Source attribution, SSRF, provider failure, no fake metrics |
| `/trend-factory/sources` | Proposed restricted | Source registry | Add/disable approved sources | Owner/operator scope | Allowlist, rights review, SSRF prevention |
| `/trend-factory/signals` | Proposed | Signal explorer | Filter/inspect signals | Approved metadata | Provenance, freshness, injection resistance |
| `/admin` | Observed | Existing single admin dashboard | Admin operations via admin APIs | Platform owner; future delegated roles disabled by default | MFA, step-up auth, audit, least privilege |
| `/admin/users` | Proposed | User governance | Search, suspend, review accounts | Owner or explicit user-governance scope | Every action audited; no credential visibility |
| `/admin/novels` | Proposed | Catalog governance | Review/publish/unpublish | Explicit catalog scope; ownership checks | No silent author ownership transfer |
| `/admin/security` | Proposed | Security centre | Sessions, alerts, incidents | Owner/security scope | MFA, no secret display, immutable audit |
| `/admin/payments` | Proposed | Payment reconciliation | Review pending/approved/rejected records | Owner/finance scope | Idempotency, no double-credit, separation of duties where available |
| `/admin/providers` | Proposed | Provider health/config | Disable/revoke connector | Owner/provider scope | Secrets masked; kill switch |
| `/admin/audit` | Proposed | Audit explorer | Search security/admin events | Owner/audit scope; sensitive values redacted | Tamper resistance and access log |
| `/privacy` | Observed legal page | Privacy notice | Read | Public legal content | Version/date and consistency with actual practices |
| `/terms` | Observed legal page | Terms | Read | Public legal content | Version/date |
| `/copyright` | Observed legal page | Copyright process | Submit claim/contact process when implemented | Reporter personal data restricted | Abuse controls, evidence access limits, appeal |

## API-to-domain mapping baseline
Observed client API references include: `/api/me`, `/api/auth/*`, `/api/profile`, `/api/novels`, `/api/novels/:id`, `/api/formats`, `/api/genres`, `/api/tags`, `/api/discovery/graph`, `/api/platform/overview`, `/api/recommendations`, `/api/leaderboard`, `/api/tier-list`, `/api/random`, `/api/made-for-you`, `/api/chapters/:id`, `/api/reading-position`, `/api/chapter-engagement`, `/api/novel-engagement`, `/api/library`, `/api/history`, `/api/bookmark`, `/api/bookmarks`, `/api/follow`, `/api/follows`, `/api/requests`, `/api/comments`, `/api/rating`, `/api/vote-novels`, `/api/tickets/ledger`, `/api/omni/status`, `/api/omni/search`, `/api/omni/import`, `/api/notifications`, `/api/notifications/read`, `/api/author/applications/me`, `/api/author/applications`, `/api/author/analytics`, `/api/author/novels`, `/api/author/chapters`.

Exact HTTP methods, handler-level authorization, database tables and response schemas must be verified against the complete Worker dispatcher before implementation. Do not infer a safe permission from the client UI or API name.

## Global authorization rules
- Public GET access is limited to intentionally published fields and content.
- Every user-owned read/write uses authenticated principal + resource ownership or explicit scoped grant, enforced server-side.
- Every privileged mutation requires a named permission, step-up authentication where risk warrants it, audit event and safe error behavior.
- Private responses use `Cache-Control: private, no-store` or an explicitly reviewed private caching design; never shared edge cache.
- Background jobs use narrow service identities and re-check ownership/consent at execution time.
- IDs are references, not capabilities. A URL or UUID never grants access by itself.

## Global screen-state and accessibility contract
Every screen must define loading, skeleton, empty, error, offline/timeout, unauthorized, forbidden, not-found, stale-data and success states. Keyboard access, screen-reader labels, focus management, reduced motion, contrast, mobile layout, RTL and localized text expansion must be tested.

## Global test dimensions
Run route matching and HTTP status tests; direct deep-link refresh; anonymous/authenticated/owner/other-user/moderator/owner-admin cases; malformed identifiers; query fuzzing; CSRF/XSS/IDOR/mass-assignment; cache privacy; rate limits; API outage; mobile network; localization/RTL; canonical metadata; and navigation back/forward.

## Completion gates
1. Every observed and proposed route has a stable route ID and status.
2. Every route maps to a screen, component inventory, actions and API contracts.
3. Every API maps to owning domain, data entities and explicit permission checks.
4. Every sensitive operation has negative cross-user and privilege-boundary tests.
5. Every route has loading/empty/error/unauthorized/not-found states and accessibility/localization criteria.
6. Canonical routes, redirects, sitemap, robots and indexing policy agree.
7. Source implementation is reconciled against this matrix; no proposed route is represented as already implemented.
8. Automated route/API coverage checks are implemented before architecture sign-off.

## Known unresolved audit items
- Confirm exact API methods and complete handler map in `src/index.js`.
- Confirm all actual HTML dispatch patterns and true HTTP status behavior for unmatched paths.
- Decide `/discover` vs `/catalog` canonical route and `/for-you` vs `/made-for-you` canonical route.
- Define safe public profile visibility and private activity defaults.
- Replace broad single `users.role` assumptions with scoped grants only after migration and compatibility plan.
- Verify block/mute/report features in backend; source audit did not find complete user-to-user block/mute/DM behavior.
- Verify admin dashboard actions individually; current admin HTML is a consolidated dashboard, not proof of separate routed admin screens.
- Add genre/tag detail, public user profile, full Creator Studio, OmniPortal and Trend Factory subroutes only after route and permission design is approved.

## Related documents
- `IMPERIAL-MASTER-ROUTE-REGISTRY-01N.md`
- `IMPERIAL-MASTER-ROUTE-REGISTRY-01N.json`
- `IMPERIAL-ROUTE-NAVIGATION-COVERAGE-AUDIT-01N-2.md`
- `IMPERIAL-SOLO-OWNER-AND-SCALABILITY-BLUEPRINT-01N-4.md`
- `IMPERIAL-DATA-PROTECTION-AND-PRIVACY-SECURITY-01N-10.md`