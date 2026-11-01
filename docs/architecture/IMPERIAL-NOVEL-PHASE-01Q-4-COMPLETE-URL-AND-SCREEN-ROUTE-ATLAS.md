# Imperial Novel | Phase 01Q.4: Complete URL and Screen Route Atlas

**Product:** Imperial Novel  
**Brand line:** Read • Create • Conquer  
**Branch:** `architecture/phase-01m-screen-blueprint`  
**Status:** Target route architecture; source reconciliation and implementation gates remain open.  
**Purpose:** Define a complete, navigable URL for every screen, feature, entity detail and staff workspace. This is the screen/navigation route map, not the API endpoint catalogue. See Phase 01Q.3 for API contracts.

## 1. The rule: nothing exists in navigation without a route

Every destination that can be reached from a menu, button, card, tab, breadcrumb, notification, search result, profile, sitemap or deep link must resolve to a registered route or a registered non-route interaction.

Every route record must specify:
1. Stable route ID and domain.
2. Exact canonical path template, parameter names and parameter constraints.
3. Screen/component destination and shell.
4. Parent route, breadcrumb and navigation entry points.
5. Audience, authentication, account-state and permission requirements.
6. Resource ownership predicate and resource visibility policy.
7. API operations and data dependencies.
8. SEO/indexing/canonical policy.
9. Loading, empty, error, forbidden, not-found, offline and expired states.
10. Redirect/alias behavior and query parameter policy.
11. Responsive/accessibility behavior and acceptance tests.
12. Lifecycle status: Planned, Specified, Source-Verified, Implemented, Tested, Deployed or Blocked.

A menu item must never point to `#`, an empty href, a guessed URL or an unregistered route. If an interaction does not navigate, it must be explicitly registered as an action with its preconditions and outcome. No route is considered implemented merely because it appears in this document.

## 2. Route syntax and URL conventions

### 2.1 Canonical patterns

- Lowercase static path segments, hyphen-separated words.
- Stable opaque IDs are used internally and in APIs; human-readable slugs are used in public URLs.
- Public work URLs use a canonical novel slug and chapter number/slug.
- User public identity uses a reserved handle namespace such as `/@{username}`; private account screens use `/account/*`.
- Author workspace screens use `/author/*` and always scope records to the authenticated author unless a separately authorized staff workflow applies.
- Administration uses `/admin/*`, a separate shell, and server-enforced permissions.
- Locale prefix is optional only if the platform adopts locale-prefixed URLs consistently. If adopted, one canonical locale policy must prevent duplicate indexing.
- Trailing slash policy is consistent; canonical URLs omit trailing slash except root.
- Query parameters are reserved for filters, search, pagination, sort, referral attribution and safe return paths. They never carry authorization.
- IDs in user-facing paths must not expose secrets or act as bearer tokens.
- Unknown paths render a branded 404 page with useful recovery links, not a blank page.

### 2.2 Reserved namespaces and collision policy

Reserved first-level namespaces include: `discover`, `search`, `trending`, `for-you`, `rankings`, `genres`, `tags`, `categories`, `collections`, `novel`, `author`, `@handle`, `community`, `library`, `account`, `create`, `author-studio`, `admin`, `help`, `legal`, `about`, `status`, and `api`.

Usernames, author handles, genre slugs, tag slugs and novel slugs must be validated against reserved names. Static routes take precedence over dynamic routes. Route matching must be deterministic and tested.

## 3. Global public routes

| Route ID | Canonical URL | Screen / purpose | Access | SEO |
|---|---|---|---|---|
| PUB-HOME | `/` | Home | Everyone | Index |
| PUB-DISCOVER | `/discover` | Discovery hub | Everyone | Index |
| PUB-SEARCH | `/search?q={query}` | Search results | Everyone | Query policy |
| PUB-TRENDING | `/trending` | Trending works/topics | Everyone | Index |
| PUB-FOR-YOU | `/for-you` | Personalized recommendations | Signed in; anonymous fallback may be a generic discovery screen | Noindex |
| PUB-RANKINGS | `/rankings` | Ranking hub | Everyone | Index |
| PUB-RANKING-CATEGORY | `/rankings/{rankingType}` | Specific ranking: views, ratings, updates, new, completed, weekly/monthly | Everyone | Index only for curated stable variants |
| PUB-NEW | `/new-releases` | Newly published works | Everyone | Index |
| PUB-UPDATES | `/recent-updates` | Recently updated works/chapters | Everyone | Index |
| PUB-COMPLETED | `/completed` | Completed works | Everyone | Index |
| PUB-ONGOING | `/ongoing` | Ongoing works | Everyone | Index |
| PUB-LANGUAGES | `/languages` | Language directory | Everyone | Index |
| PUB-LANGUAGE | `/language/{languageCode}` | Works in a language | Everyone | Index |
| PUB-FORMATS | `/formats` | Content format directory | Everyone | Index |
| PUB-FORMAT | `/format/{formatSlug}` | Works in a format | Everyone | Index |
| PUB-COLLECTIONS | `/collections` | Public collections directory | Everyone | Index |
| PUB-COLLECTION | `/collections/{collectionSlug}` | Public collection detail | Everyone | Index if public |
| PUB-AUTHORS | `/authors` | Author directory | Everyone | Index |
| PUB-AUTHOR | `/author/{authorHandle}` | Public author profile and works | Everyone | Index |
| PUB-USER | `/@{username}` | Public reader/creator profile | Everyone; profile visibility applies | Index only if public |
| PUB-ANNOUNCEMENTS | `/announcements` | Platform announcements | Everyone | Index |
| PUB-ANNOUNCEMENT | `/announcements/{announcementSlug}` | Announcement detail | Everyone | Index |
| PUB-ABOUT | `/about` | About Imperial Novel | Everyone | Index |
| PUB-HELP | `/help` | Help centre | Everyone | Index |
| PUB-HELP-ARTICLE | `/help/{articleSlug}` | Help article | Everyone | Index |
| PUB-CONTACT | `/contact` | Contact page/form | Everyone | Index |
| PUB-STATUS | `/status` | Service status | Everyone | Index |
| PUB-SITEMAP | `/sitemap.xml` | XML sitemap resource | Crawler/everyone | Sitemap |
| PUB-ROBOTS | `/robots.txt` | Crawler policy resource | Everyone | Robots policy |

## 4. Taxonomy routes: every genre, tag and category has its own URL

### 4.1 Genres

| Route ID | Canonical URL | Screen |
|---|---|---|
| TAX-GENRE-INDEX | `/genres` | Complete genre directory |
| TAX-GENRE-DETAIL | `/genre/{genreSlug}` | One genre landing page |
| TAX-GENRE-SUBGENRES | `/genre/{genreSlug}/subgenres` | Subgenre directory |
| TAX-SUBGENRE | `/genre/{genreSlug}/{subgenreSlug}` | Specific subgenre listing |

Every genre record has a unique normalized slug, title, description, localization fields, parent/subgenre relationship, visibility, SEO metadata and canonical route. A genre detail page lists eligible published works and its child genres. Genre aliases redirect to the canonical slug.

### 4.2 Tags

| Route ID | Canonical URL | Screen |
|---|---|---|
| TAX-TAG-INDEX | `/tags` | Tag directory |
| TAX-TAG-DETAIL | `/tag/{tagSlug}` | One tag landing page |
| TAX-TAG-RELATED | `/tag/{tagSlug}/related` | Related tags |
| TAX-TAG-COMBINATION | `/tags/{tagSlugA}/{tagSlugB}` | Optional curated two-tag intersection; only if approved and useful |

Every tag has a dedicated detail URL. Tag combinations are not generated as infinite indexable pages: only curated, useful combinations are indexable; arbitrary filter combinations are noindex/canonicalized.

### 4.3 Categories and themes

| Route ID | Canonical URL | Screen |
|---|---|---|
| TAX-CATEGORIES | `/categories` | Category directory |
| TAX-CATEGORY | `/category/{categorySlug}` | Category detail |
| TAX-THEMES | `/themes` | Theme directory |
| TAX-THEME | `/theme/{themeSlug}` | Theme detail |
| TAX-TAXONOMY-REQUEST | `/taxonomy/request` | Reader/author taxonomy suggestion form |

Taxonomy staff screens are in the Admin route map. A taxonomy suggestion URL is not an approval route.

## 5. Novel and chapter routes: every work and every chapter has a canonical destination

| Route ID | Canonical URL | Screen / purpose | Access |
|---|---|---|---|
| CAT-NOVEL-DETAIL | `/novel/{novelSlug}` | Novel overview, metadata, cover, synopsis, status, rating and actions | Public if published and rights-eligible |
| CAT-NOVEL-CHAPTERS | `/novel/{novelSlug}/chapters` | Complete published chapter list | Public eligible chapters |
| CAT-NOVEL-REVIEWS | `/novel/{novelSlug}/reviews` | Reviews and rating summaries | Public visible reviews |
| CAT-NOVEL-REVIEW | `/novel/{novelSlug}/reviews/{reviewId}` | Individual review detail, if standalone | Public visible review |
| CAT-NOVEL-RELATED | `/novel/{novelSlug}/related` | Related works | Public |
| CAT-NOVEL-RECOMMENDATIONS | `/novel/{novelSlug}/recommendations` | Recommendation explanation/list | Public-safe |
| CAT-NOVEL-CHAPTER | `/novel/{novelSlug}/chapter/{chapterNumber}/{chapterSlug}` | One specific chapter reader screen | Public if published; locked content requires entitlement |
| CAT-NOVEL-CHAPTER-NUMBER | `/novel/{novelSlug}/chapter/{chapterNumber}` | Stable chapter-number alias resolving to canonical chapter slug | Redirect |
| CAT-NOVEL-CHAPTER-COMMENTS | `/novel/{novelSlug}/chapter/{chapterNumber}/{chapterSlug}/comments` | Chapter discussion | Public visible comments |
| CAT-NOVEL-CHAPTER-REPORT | `/novel/{novelSlug}/chapter/{chapterNumber}/{chapterSlug}/report` | Report chapter | Signed in |
| CAT-NOVEL-UNLOCK | `/novel/{novelSlug}/chapter/{chapterNumber}/{chapterSlug}/unlock` | Unlock confirmation/checkout state | Signed in; entitlement check |
| CAT-NOVEL-SHARE | `/novel/{novelSlug}/share` | Share/QR landing or share action | Public |

**Canonical chapter identity:** the chapter is a child of its novel. The route must validate that the chapter belongs to the novel in the path. A mismatched novel/chapter pair returns not-found, not another work's content. Chapter number and slug must resolve to one record. Renumbering or slug changes use explicit redirects while preserving a stable chapter identity internally.

**Reader navigation:** previous chapter, next chapter, chapter index, resume, table of contents, font/theme settings and progress controls are explicit registered links/actions. A locked chapter never leaks its protected body in HTML, API responses, prefetch payloads or metadata.

## 6. User route space: every account has its own private destinations

Public profile routes (`/@{username}`) are separate from private account routes. The account owner is always derived from the authenticated session, never from a user ID in the URL.

| Route ID | Canonical URL | Screen | Access |
|---|---|---|---|
| USER-ACCOUNT | `/account` | Account overview | Signed in |
| USER-PROFILE-SETTINGS | `/account/profile` | Edit profile and public visibility | Own account |
| USER-AVATAR | `/account/profile/avatar` | Avatar management | Own account |
| USER-SECURITY | `/account/security` | Password, sessions and security | Own account, step-up for sensitive actions |
| USER-SESSIONS | `/account/security/sessions` | Active sessions/devices | Own account |
| USER-PRIVACY | `/account/privacy` | Privacy and discoverability | Own account |
| USER-PREFERENCES | `/account/preferences` | Language, theme, reading and notification preferences | Own account |
| USER-LANGUAGE | `/account/preferences/language` | Language settings | Own account |
| USER-READING-PREFS | `/account/preferences/reading` | Reader comfort settings | Own account |
| USER-NOTIFICATION-PREFS | `/account/preferences/notifications` | Notification controls | Own account |
| USER-ACCESSIBILITY | `/account/preferences/accessibility` | Reduced motion, contrast, text and accessibility options | Own account |
| USER-EMAIL | `/account/email` | Email management and verification | Own account |
| USER-EXPORT | `/account/data-export` | Request/download personal data export | Own account |
| USER-DELETION | `/account/delete` | Account deletion request and confirmation | Own account, step-up |
| USER-RESTRICTION | `/account/status` | Restriction/suspension explanation and appeal entry | Own account |
| USER-APPEAL | `/account/appeal` | Submit/view own appeal | Own account |

### 6.1 Personal library and activity

| Route ID | Canonical URL | Screen |
|---|---|---|
| LIB-HOME | `/library` | Library overview |
| LIB-READING | `/library/reading` | Currently reading |
| LIB-COMPLETED | `/library/completed` | Completed works |
| LIB-PLAN | `/library/plan-to-read` | Plan to read |
| LIB-ON-HOLD | `/library/on-hold` | On hold |
| LIB-DROPPED | `/library/dropped` | Dropped |
| LIB-BOOKMARKS | `/library/bookmarks` | Bookmarked works/chapters |
| LIB-COLLECTIONS | `/library/collections` | Own collections |
| LIB-COLLECTION | `/library/collections/{collectionId}` | One private collection |
| LIB-HISTORY | `/library/history` | Reading history |
| LIB-HISTORY-NOVEL | `/library/history/{novelSlug}` | Reading history for one work |
| LIB-PROGRESS | `/library/progress` | Reading progress overview |
| LIB-FOLLOWING | `/library/following` | Followed authors/users |
| LIB-FOLLOWERS | `/library/followers` | Followers, subject to privacy |
| LIB-HIDDEN | `/library/hidden` | Muted/hidden works and accounts |

Every personal library route is scoped to the signed-in principal. The URL does not accept another user's ID as a way to open their private library. Public profile shelves are separately governed by profile visibility.

### 6.2 Notifications and inbox

| Route ID | Canonical URL | Screen |
|---|---|---|
| USER-INBOX | `/inbox` | Notification centre |
| USER-INBOX-ALL | `/inbox/all` | All notifications |
| USER-INBOX-UNREAD | `/inbox/unread` | Unread notifications |
| USER-INBOX-MENTIONS | `/inbox/mentions` | Mentions/replies |
| USER-INBOX-SYSTEM | `/inbox/system` | Platform notices |
| USER-INBOX-ITEM | `/inbox/{notificationId}` | Notification detail/action destination |

Notification routes are private. Every notification target must itself resolve through the route registry and re-check the target resource's access policy.

## 7. Creator and Author Studio route space

The public author profile (`/author/{authorHandle}`) is not the private workspace. All workspace records are owner-scoped.

| Route ID | Canonical URL | Screen |
|---|---|---|
| CREATOR-ENTRY | `/create` | Creator entry/onboarding |
| CREATOR-APPLICATION | `/create/apply` | Author application |
| CREATOR-APPLICATION-STATUS | `/create/application` | Own application status |
| CREATOR-STUDIO | `/author-studio` | Author Studio dashboard |
| CREATOR-WORKS | `/author-studio/works` | Own works |
| CREATOR-WORK-NEW | `/author-studio/works/new` | Create a work |
| CREATOR-WORK | `/author-studio/works/{workId}` | Work workspace |
| CREATOR-WORK-EDIT | `/author-studio/works/{workId}/edit` | Work metadata editor |
| CREATOR-WORK-COVER | `/author-studio/works/{workId}/cover` | Cover management |
| CREATOR-WORK-GENRES | `/author-studio/works/{workId}/genres` | Genre selection |
| CREATOR-WORK-TAGS | `/author-studio/works/{workId}/tags` | Tag selection |
| CREATOR-WORK-RIGHTS | `/author-studio/works/{workId}/rights` | Rights declaration/evidence |
| CREATOR-CHAPTERS | `/author-studio/works/{workId}/chapters` | Chapter manager |
| CREATOR-CHAPTER-NEW | `/author-studio/works/{workId}/chapters/new` | Create chapter |
| CREATOR-CHAPTER-EDIT | `/author-studio/works/{workId}/chapters/{chapterId}/edit` | Chapter editor |
| CREATOR-CHAPTER-PREVIEW | `/author-studio/works/{workId}/chapters/{chapterId}/preview` | Reader preview |
| CREATOR-CHAPTER-VERSIONS | `/author-studio/works/{workId}/chapters/{chapterId}/versions` | Version history |
| CREATOR-PUBLISH | `/author-studio/works/{workId}/publish` | Publication checklist/review submission |
| CREATOR-SCHEDULE | `/author-studio/works/{workId}/schedule` | Release schedule |
| CREATOR-ANALYTICS | `/author-studio/analytics` | Author analytics overview |
| CREATOR-WORK-ANALYTICS | `/author-studio/works/{workId}/analytics` | Per-work analytics |
| CREATOR-COMMENTS | `/author-studio/comments` | Reader feedback management |
| CREATOR-REVENUE | `/author-studio/revenue` | Author earnings/eligible revenue view |
| CREATOR-PAYOUTS | `/author-studio/payouts` | Payout status, if payout system is approved |
| CREATOR-SETTINGS | `/author-studio/settings` | Creator settings |
| CREATOR-TEAM | `/author-studio/team` | Collaborators and scoped access |
| CREATOR-AI | `/author-studio/ai` | AI Author Studio home |
| CREATOR-AI-PROJECTS | `/author-studio/ai/projects` | Own AI projects |
| CREATOR-AI-NEW | `/author-studio/ai/projects/new` | Create AI project |
| CREATOR-AI-PROJECT | `/author-studio/ai/projects/{projectId}` | AI project workspace |
| CREATOR-AI-BIBLE | `/author-studio/ai/projects/{projectId}/story-bible` | Story bible |
| CREATOR-AI-OUTLINE | `/author-studio/ai/projects/{projectId}/outline` | Outline |
| CREATOR-AI-JOBS | `/author-studio/ai/projects/{projectId}/jobs` | Generation jobs |
| CREATOR-AI-BENCHMARKS | `/author-studio/ai/benchmarks` | Verified provider benchmark data |

Drafts, AI projects, chapter versions, analytics and creator financial data must never be exposed by changing an ID in the URL.

## 8. Community route space

| Route ID | Canonical URL | Screen |
|---|---|---|
| COM-HOME | `/community` | Community home |
| COM-FEED | `/community/feed` | Community feed |
| COM-DISCUSSIONS | `/community/discussions` | Discussion index |
| COM-DISCUSSION-NEW | `/community/discussions/new` | Create discussion |
| COM-DISCUSSION | `/community/discussions/{discussionId}` | Discussion detail |
| COM-DISCUSSION-EDIT | `/community/discussions/{discussionId}/edit` | Own discussion editor |
| COM-TOPICS | `/community/topics` | Topic directory |
| COM-TOPIC | `/community/topic/{topicSlug}` | Topic feed |
| COM-GROUPS | `/community/groups` | Public groups |
| COM-GROUP | `/community/groups/{groupSlug}` | Group detail |
| COM-GROUP-MEMBERS | `/community/groups/{groupSlug}/members` | Members, privacy-filtered |
| COM-EVENTS | `/community/events` | Events |
| COM-EVENT | `/community/events/{eventSlug}` | Event detail |
| COM-LEADERBOARD | `/community/leaderboard` | Community leaderboard |
| COM-TIER-LISTS | `/community/tier-lists` | Public tier lists |
| COM-TIER-LIST | `/community/tier-lists/{listId}` | Tier list detail |
| COM-REPORTS | `/community/reports` | Own submitted reports/status, if exposed |
| COM-BLOCKED | `/community/blocked` | Own blocked accounts |
| COM-MUTED | `/community/muted` | Own muted accounts |

A comment, review or discussion may be an anchored resource rather than a standalone page. If it is not independently navigable, it still receives a stable anchor/deep-link contract and a parent route. Every action such as reply, edit, delete, like, report, block or mute has a named action contract and authorization rule.

## 9. Commerce and ticket route space

| Route ID | Canonical URL | Screen |
|---|---|---|
| PAY-HOME | `/wallet` | Wallet/ticket overview |
| PAY-BALANCE | `/wallet/balance` | Ticket balance and explanation |
| PAY-LEDGER | `/wallet/ledger` | Own ticket ledger |
| PAY-PACKS | `/wallet/top-up` | Available ticket packages |
| PAY-CHECKOUT | `/wallet/checkout/{packageId}` | Checkout confirmation |
| PAY-ORDER | `/wallet/orders/{orderId}` | Own payment/order status |
| PAY-HISTORY | `/wallet/history` | Own payment history |
| PAY-RECEIPT | `/wallet/receipts/{orderId}` | Own receipt |
| PAY-SUPPORT | `/wallet/support` | Payment issue support |
| PAY-UNLOCK | `/unlock/{novelSlug}/{chapterNumber}` | Chapter unlock confirmation |
| PAY-UNLOCK-RESULT | `/unlock/receipt/{unlockId}` | Own unlock receipt/result |

All routes require server-side price and balance validation. Payment integration must remain visibly unavailable until the merchant account, webhook signature, replay handling, reconciliation and refund/support processes are verified. Never simulate a successful payment.

## 10. OmniPortal and Trend Factory route space

### 10.1 OmniPortal

| Route ID | Canonical URL | Screen |
|---|---|---|
| OMNI-HOME | `/omni` | OmniPortal overview |
| OMNI-SEARCH | `/omni/search?q={query}` | Federated authorized metadata search |
| OMNI-SOURCES | `/omni/sources` | Public provider directory/status |
| OMNI-SOURCE | `/omni/sources/{providerSlug}` | Provider detail, rights and capabilities |
| OMNI-IMPORTS | `/omni/imports` | Own import jobs |
| OMNI-IMPORT | `/omni/imports/{jobId}` | Own import job detail |
| OMNI-REQUEST | `/omni/access-request` | Request provider/rights review |
| OMNI-POLICY | `/omni/rights-policy` | Rights and source policy |

### 10.2 Trend Factory

| Route ID | Canonical URL | Screen |
|---|---|---|
| TREND-HOME | `/trend-factory` | Trend Factory overview |
| TREND-DISCOVER | `/trend-factory/discover` | Approved-source trend discovery |
| TREND-TOPIC | `/trend-factory/topics/{topicId}` | Topic evidence and provenance |
| TREND-SOURCES | `/trend-factory/sources` | Source registry |
| TREND-QUEUE | `/trend-factory/queue` | Own/assigned editorial queue |
| TREND-ITEM | `/trend-factory/items/{itemId}` | Trend item review |
| TREND-REPORTS | `/trend-factory/reports` | Trend reports |

These workspaces require explicit feature enablement and role/assignment checks. Public visitors must not see internal source credentials, reviewer notes or private editorial queues.

## 11. Admin route space: dedicated route for every administrative module

Admin is a distinct shell and namespace. A route existing does not mean every administrator can access it. Each route has a granular permission, staff assignment scope and audit policy. Super-administrator access is not a universal bypass.

### 11.1 Admin home and operations

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-HOME | `/admin` | Admin dashboard |
| ADM-OVERVIEW | `/admin/overview` | Operations overview |
| ADM-ACTIVITY | `/admin/activity` | Staff activity/audit feed |
| ADM-TASKS | `/admin/tasks` | Assigned tasks |
| ADM-QUEUE | `/admin/queues` | Work queues |
| ADM-ANNOUNCEMENTS | `/admin/announcements` | Announcement management |
| ADM-FEATURES | `/admin/features` | Feature flags/capability status |
| ADM-SYSTEM-STATUS | `/admin/system/status` | System health |
| ADM-SYSTEM-INCIDENTS | `/admin/system/incidents` | Incident management |
| ADM-SYSTEM-LOGS | `/admin/system/logs` | Restricted operational logs |

### 11.2 Users, identity, roles and permissions

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-USERS | `/admin/users` | User directory |
| ADM-USER | `/admin/users/{userId}` | User detail |
| ADM-USER-SECURITY | `/admin/users/{userId}/security` | Account security state |
| ADM-USER-SESSIONS | `/admin/users/{userId}/sessions` | Session management |
| ADM-USER-RESTRICTIONS | `/admin/users/{userId}/restrictions` | Restrictions and history |
| ADM-USER-APPEALS | `/admin/users/{userId}/appeals` | Appeal case view |
| ADM-ROLES | `/admin/access/roles` | Role registry |
| ADM-ROLE | `/admin/access/roles/{roleId}` | Role detail |
| ADM-PERMISSIONS | `/admin/access/permissions` | Permission registry |
| ADM-ASSIGNMENTS | `/admin/access/assignments` | Role/resource assignments |
| ADM-ACCESS-REQUESTS | `/admin/access/requests` | Access approval queue |
| ADM-ACCESS-REQUEST | `/admin/access/requests/{requestId}` | Access request detail |
| ADM-ACCESS-AUDIT | `/admin/access/audit` | Access audit history |
| ADM-EMERGENCY-ACCESS | `/admin/access/emergency` | Time-limited emergency access |

### 11.3 Catalog, publishing, authors and rights

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-CATALOG | `/admin/catalog` | Catalog overview |
| ADM-CATALOG-NOVELS | `/admin/catalog/novels` | All catalog records |
| ADM-CATALOG-NOVEL | `/admin/catalog/novels/{novelId}` | Catalog record review |
| ADM-CATALOG-CHAPTERS | `/admin/catalog/chapters` | Chapter records |
| ADM-CATALOG-CHAPTER | `/admin/catalog/chapters/{chapterId}` | Chapter record review |
| ADM-PUBLISHING-QUEUE | `/admin/publishing/queue` | Publishing review queue |
| ADM-PUBLISHING-ITEM | `/admin/publishing/{submissionId}` | Submission review |
| ADM-AUTHORS | `/admin/authors` | Author directory |
| ADM-AUTHOR-APPLICATIONS | `/admin/authors/applications` | Application queue |
| ADM-AUTHOR-APPLICATION | `/admin/authors/applications/{applicationId}` | Application detail |
| ADM-RIGHTS | `/admin/rights` | Rights review dashboard |
| ADM-RIGHTS-CASES | `/admin/rights/cases` | Rights case queue |
| ADM-RIGHTS-CASE | `/admin/rights/cases/{caseId}` | Rights evidence/review |
| ADM-TAKEDOWNS | `/admin/rights/takedowns` | Takedown queue |
| ADM-TAKEDOWN | `/admin/rights/takedowns/{caseId}` | Takedown case |

### 11.4 Taxonomy and discovery governance

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-TAXONOMY | `/admin/taxonomy` | Taxonomy dashboard |
| ADM-GENRES | `/admin/taxonomy/genres` | Genre manager |
| ADM-GENRE | `/admin/taxonomy/genres/{genreId}` | Genre editor |
| ADM-SUBGENRES | `/admin/taxonomy/subgenres` | Subgenre manager |
| ADM-TAGS | `/admin/taxonomy/tags` | Tag manager |
| ADM-TAG | `/admin/taxonomy/tags/{tagId}` | Tag editor |
| ADM-CATEGORIES | `/admin/taxonomy/categories` | Category manager |
| ADM-CATEGORY | `/admin/taxonomy/categories/{categoryId}` | Category editor |
| ADM-TAXONOMY-REQUESTS | `/admin/taxonomy/requests` | Taxonomy suggestion queue |
| ADM-COLLECTIONS | `/admin/discovery/collections` | Curated collections |
| ADM-COLLECTION | `/admin/discovery/collections/{collectionId}` | Collection editor |
| ADM-RANKINGS | `/admin/discovery/rankings` | Ranking configuration |
| ADM-RECOMMENDATIONS | `/admin/discovery/recommendations` | Recommendation controls |

### 11.5 Community, trust and moderation

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-COMMUNITY | `/admin/community` | Community operations |
| ADM-MOD-QUEUE | `/admin/moderation/queue` | Moderation queue |
| ADM-MOD-CASE | `/admin/moderation/cases/{caseId}` | Moderation case |
| ADM-REPORTS | `/admin/reports` | Report queue |
| ADM-REPORT | `/admin/reports/{reportId}` | Report detail |
| ADM-APPEALS | `/admin/moderation/appeals` | Appeal queue |
| ADM-APPEAL | `/admin/moderation/appeals/{appealId}` | Appeal detail |
| ADM-BLOCKLIST | `/admin/trust/blocklist` | Abuse/blocklist management |
| ADM-SPAM | `/admin/trust/spam` | Spam/abuse signals |
| ADM-POLICIES | `/admin/trust/policies` | Moderation policy reference |

### 11.6 Finance, payments and monetization

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-FINANCE | `/admin/finance` | Finance overview |
| ADM-PAYMENTS | `/admin/finance/payments` | Payment queue |
| ADM-PAYMENT | `/admin/finance/payments/{paymentId}` | Payment detail/review |
| ADM-REFUNDS | `/admin/finance/refunds` | Refund queue |
| ADM-REFUND | `/admin/finance/refunds/{refundId}` | Refund case |
| ADM-TICKETS | `/admin/finance/tickets` | Ticket ledger oversight |
| ADM-TICKET-ADJUSTMENTS | `/admin/finance/ticket-adjustments` | Adjustment proposals/approvals |
| ADM-REVENUE | `/admin/finance/revenue` | Revenue reporting |
| ADM-ADS | `/admin/monetization/ads` | Monetag/ad placement and policy status |
| ADM-PAYMENT-PROVIDERS | `/admin/finance/providers` | Payment provider configuration/status |

Finance roles are separated into operator and approver duties. Payment secrets never appear in route payloads. A route for a provider configuration screen does not imply that a payment provider is connected.

### 11.7 OmniPortal, connectors and Trend Factory governance

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-OMNI | `/admin/omni` | OmniPortal admin overview |
| ADM-OMNI-PROVIDERS | `/admin/omni/providers` | Provider registry |
| ADM-OMNI-PROVIDER | `/admin/omni/providers/{providerId}` | Provider detail |
| ADM-OMNI-RIGHTS | `/admin/omni/rights-requests` | Rights authorization queue |
| ADM-OMNI-RIGHTS-CASE | `/admin/omni/rights-requests/{requestId}` | Rights request review |
| ADM-OMNI-IMPORTS | `/admin/omni/imports` | Import job oversight |
| ADM-OMNI-HEALTH | `/admin/omni/health` | Provider health |
| ADM-TRENDS | `/admin/trend-factory` | Trend Factory admin |
| ADM-TREND-SOURCES | `/admin/trend-factory/sources` | Approved source registry |
| ADM-TREND-QUEUE | `/admin/trend-factory/queue` | Editorial queue |
| ADM-TREND-ITEM | `/admin/trend-factory/items/{itemId}` | Editorial item review |

### 11.8 AI, agents and automation

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-AI | `/admin/ai` | AI operations overview |
| ADM-AI-PROVIDERS | `/admin/ai/providers` | Provider configuration/status, secret-safe |
| ADM-AI-USAGE | `/admin/ai/usage` | Usage and cost controls |
| ADM-AI-POLICY | `/admin/ai/policy` | AI policy |
| ADM-AGENTS | `/admin/agents` | Agent directory |
| ADM-AGENT | `/admin/agents/{agentId}` | Agent detail and permissions |
| ADM-AGENT-RUNS | `/admin/agents/{agentId}/runs` | Agent run history |
| ADM-AUTOMATIONS | `/admin/automations` | Automation registry |
| ADM-AUTOMATION | `/admin/automations/{automationId}` | Automation detail |
| ADM-JOBS | `/admin/jobs` | Background jobs |
| ADM-JOB | `/admin/jobs/{jobId}` | Job detail/retry/cancel according to permission |

Agents cannot grant themselves permissions, bypass provider rights, publish unreviewed content, approve their own financial actions or access user-private content outside an explicit authorized task.

### 11.9 Analytics, SEO and platform configuration

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-ANALYTICS | `/admin/analytics` | Analytics overview |
| ADM-ANALYTICS-READERS | `/admin/analytics/readers` | Reader metrics |
| ADM-ANALYTICS-CATALOG | `/admin/analytics/catalog` | Catalog metrics |
| ADM-ANALYTICS-AUTHORS | `/admin/analytics/authors` | Author metrics |
| ADM-ANALYTICS-REVENUE | `/admin/analytics/revenue` | Restricted finance analytics |
| ADM-SEO | `/admin/seo` | SEO health |
| ADM-SEO-REDIRECTS | `/admin/seo/redirects` | Redirect manager |
| ADM-SEO-SITEMAPS | `/admin/seo/sitemaps` | Sitemap status |
| ADM-SEO-STRUCTURED-DATA | `/admin/seo/structured-data` | Structured data diagnostics |
| ADM-LOCALIZATION | `/admin/localization` | Locale coverage |
| ADM-TRANSLATIONS | `/admin/localization/translations` | Translation management |
| ADM-CONTENT-PAGES | `/admin/content/pages` | Static/help content management |
| ADM-SETTINGS | `/admin/settings` | Platform settings |
| ADM-SETTINGS-GENERAL | `/admin/settings/general` | General settings |
| ADM-SETTINGS-SECURITY | `/admin/settings/security` | Security configuration |
| ADM-SETTINGS-PRIVACY | `/admin/settings/privacy` | Privacy configuration |
| ADM-SETTINGS-PERFORMANCE | `/admin/settings/performance` | Performance configuration |
| ADM-SETTINGS-EMAIL | `/admin/settings/email` | Email configuration/status |
| ADM-SETTINGS-INTEGRATIONS | `/admin/settings/integrations` | Integration status |

### 11.10 Security, audit and incidents

| Route ID | Canonical URL | Screen |
|---|---|---|
| ADM-SECURITY | `/admin/security` | Security overview |
| ADM-SECURITY-EVENTS | `/admin/security/events` | Security events |
| ADM-SECURITY-SESSIONS | `/admin/security/sessions` | Session risk/management |
| ADM-SECURITY-ACCESS | `/admin/security/access-review` | Periodic access review |
| ADM-SECURITY-VULNERABILITIES | `/admin/security/vulnerabilities` | Vulnerability register |
| ADM-SECURITY-INCIDENTS | `/admin/security/incidents` | Security incident queue |
| ADM-SECURITY-INCIDENT | `/admin/security/incidents/{incidentId}` | Incident detail |
| ADM-AUDIT | `/admin/audit` | Audit search |
| ADM-AUDIT-EVENT | `/admin/audit/events/{eventId}` | Audit event detail |
| ADM-DATA-REQUESTS | `/admin/privacy/requests` | Data export/deletion request queue |
| ADM-DATA-REQUEST | `/admin/privacy/requests/{requestId}` | Data request review |

## 12. System, error and recovery routes

| Route ID | Canonical URL | Screen |
|---|---|---|
| SYS-404 | `/404` | Not found |
| SYS-403 | `/403` | Access denied |
| SYS-401 | `/sign-in-required` | Authentication required/return flow |
| SYS-500 | `/error` | Recoverable unexpected error |
| SYS-MAINTENANCE | `/maintenance` | Maintenance notice |
| SYS-OFFLINE | `/offline` | Offline recovery |
| SYS-VERIFY-EMAIL | `/verify-email` | Email verification result |
| SYS-RESET-PASSWORD | `/reset-password` | Password reset |
| SYS-INVITE | `/invite/{inviteToken}` | Invitation acceptance; token is single-use and never indexed |
| SYS-REDIRECT | `/r/{redirectKey}` | Validated internal short-link redirect, if implemented |

System pages must not reveal whether a private resource exists when policy requires concealment. Return paths are allowlisted internal destinations to prevent open redirects.

## 13. Navigation-to-route completeness contract

### 13.1 Desktop navigation

| Menu item | Exact destination |
|---|---|
| Home | `/` |
| Discover | `/discover` |
| Trending | `/trending` |
| For You | `/for-you` |
| Rankings | `/rankings` |
| Library | `/library` |
| Community | `/community` |
| Author | `/author-studio` if authorized; otherwise `/create` |
| More | Explicit menu containing registered destinations such as genres, tags, languages, formats, authors, collections, OmniPortal, help and about |

### 13.2 Mobile navigation

| Menu item | Exact destination |
|---|---|
| Home | `/` |
| Discover | `/discover` |
| Library | `/library` |
| Create | `/author-studio` if authorized; otherwise `/create` |
| Community | `/community` |
| Profile | `/account` when signed in; otherwise `/sign-in` |

### 13.3 Menu and control mapping

Every menu, submenu, footer link, card, tab, button and icon action must be listed in a navigation-control registry with:
- control ID and owning screen;
- visible label and accessible name;
- route ID or action ID;
- destination path or action handler;
- authentication/permission precondition;
- disabled/hidden reason where unavailable;
- success, error and retry behavior;
- keyboard/touch/focus behavior;
- analytics event where privacy-approved.

A tab may use a route (`/account/security/sessions`) or an explicitly registered local-state interaction. It must never be an unexplained visual control.

## 14. Route-to-API relationship

A screen route and an API route are different layers:

- Screen URL: a browser navigation destination, e.g. `/genre/fantasy`.
- API endpoint: a data/action operation, e.g. `GET /api/genres/{slug}`.
- Action: a named user interaction, e.g. `library.bookmark.add`.

Each screen route must list the API operations it consumes. Each API operation must list the screen routes/actions that call it. Neither side may contain undocumented orphan entries. Use Phase 01Q.3 for method, request/response, authorization, transaction and side-effect details.

## 15. Route registry implementation schema

The eventual machine-readable registry should contain records equivalent to:

```json
{
  "id": "CAT-NOVEL-CHAPTER",
  "domain": "catalog.reader",
  "path": "/novel/:novelSlug/chapter/:chapterNumber/:chapterSlug",
  "canonical": true,
  "shell": "reader",
  "audience": ["anonymous", "reader"],
  "auth": "optional",
  "permission": null,
  "ownership": "public-rights-eligible-chapter; entitlement-required-if-locked",
  "parent": "CAT-NOVEL-CHAPTERS",
  "breadcrumbs": ["PUB-HOME", "CAT-NOVEL-DETAIL", "CAT-NOVEL-CHAPTERS"],
  "apiOperations": ["catalog.novel.read_public", "reader.chapter.read"],
  "indexing": "index-if-published-and-rights-eligible",
  "states": ["loading", "ready", "locked", "empty", "error", "not-found", "offline"],
  "status": "planned"
}
```

The registry must support:
- exact static and dynamic route matching;
- named parameter validation and reserved-word collision prevention;
- canonical URL generation from database records;
- aliases and permanent redirects;
- role/permission/ownership metadata;
- navigation and breadcrumb generation;
- sitemap generation from indexable records;
- API dependency links;
- route-level tests and dead-link detection;
- coverage reports for every menu/control;
- localization and canonical locale rules.

## 16. Required route tests

1. Every static route resolves to exactly one screen.
2. Every dynamic route validates every parameter.
3. Every novel chapter URL resolves to the correct parent novel and chapter.
4. Mismatched novel/chapter IDs never disclose another work.
5. Every genre, tag, category, author and public profile has its own canonical detail route.
6. Every signed-in user's private routes resolve only to that session's data.
7. Changing a user ID, collection ID, project ID, job ID, notification ID or order ID cannot cross account boundaries.
8. Admin routes reject anonymous and unauthorized staff users server-side.
9. Every admin module has a route, permission, queue/detail screen where needed, and audit contract.
10. Every navigation/menu/footer/card/tab/button destination is registered and reachable.
11. Every obsolete route has an explicit redirect or deliberate 404 decision.
12. Unknown routes render the branded 404 recovery screen.
13. Query parameters cannot bypass auth, ownership or canonicalization.
14. Sitemap contains only eligible indexable canonical routes.
15. Private routes, drafts, internal queues, account pages and sensitive query variants are noindex and excluded from sitemaps.
16. Route aliases do not create duplicate canonical pages.
17. Browser back/forward, refresh and deep-link entry work on mobile.
18. Keyboard, screen reader, focus restoration and reduced motion work across shells.
19. Every route has loading, empty, error, offline, forbidden and expired-session behavior appropriate to its domain.
20. Route coverage report has zero unregistered internal navigation destinations.

## 17. Completion gates and current status

| Work item | Status | Evidence required to advance |
|---|---|---|
| Master route families and screen destinations | Specified in this target atlas | Review against current sitemap and product requirements |
| Public taxonomy/detail routes | Specified | Reconcile existing live URLs and catalog schema |
| Per-novel and per-chapter canonical paths | Specified | Verify current router, chapter IDs/slugs and redirect compatibility |
| Per-user private route space | Specified | Verify session-derived ownership for every screen/API |
| Author Studio route space | Specified | Verify each screen against actual author handlers |
| Admin route space | Specified | Map every screen to granular permission and actual handler |
| Community and commerce route spaces | Specified | Verify features/integrations and safe unavailable states |
| OmniPortal and Trend Factory route spaces | Specified | Provider rights and feature gates |
| Screen-to-API matrix | In progress | Complete route/API/action cross-reference |
| Machine-readable registry | Not yet implemented by this document | Build from reviewed records on isolated development branch |
| Automated dead-link/coverage tests | Not yet run | Add tests and execute build/test suite |
| Production URL compatibility | Not verified | Read-only comparison against production and existing redirects |
| Production deployment | Not started | Separate approved release process and explicit confirmation |

## 18. Explicit non-claims

This atlas is comprehensive target architecture, not a claim that all these pages currently exist. Some routes describe future capabilities, such as groups, payouts, data access reviews or Trend Factory screens. They remain Planned until the feature, API, schema, permissions, UI and tests are implemented. No route should be linked as an active feature before that gate is passed.

**Decision:** Imperial Novel adopts one authoritative screen route registry and one linked API operation registry. Every navigable entity, menu destination and feature screen must have a complete canonical route, explicit access policy, screen contract and test coverage. This atlas is the route-architecture baseline for the next detailed traceability phase.
