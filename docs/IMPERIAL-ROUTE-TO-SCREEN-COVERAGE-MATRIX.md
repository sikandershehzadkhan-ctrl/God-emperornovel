# Imperial Novel: Route-to-Screen Coverage Matrix

**Purpose:** distinguish a Worker route from a complete user-facing screen.  
**Evidence baseline:** `docs/architecture/IMPERIAL-MASTER-ROUTE-REGISTRY-01N.md` and `docs/architecture/IMPERIAL-NOVEL-RESPONSIVE-PAGE-SPECS-17.25.0.md`.  
**Status:** design/engineering handoff. This document does not claim browser or production verification.

## Coverage vocabulary

- **Dedicated template observed:** the route maps to a named HTML template in the inspected route registry. Client behavior still needs verification.
- **Shared shell observed:** the route maps to `index.html` or another generic shell. A dedicated screen is not established by that mapping.
- **Dynamic screen:** one template renders different records/states from a validated resource identifier.
- **Private:** must be authorized server-side and excluded from public indexing/caches.
- **Conditional public:** index only when content is substantive, published, rights-eligible and canonical.

## Route-to-screen register

| Route | Screen owner | Screen responsibility | Primary action | Required states / release checks |
|---|---|---|---|---|
| `/` | Brand & Discovery | Editorial entry and real discovery shelves | Open a story / discover | SSR/no-JS, real eligible content, empty/error shelf, mobile |
| `/catalog` | Discovery | Filterable catalogue | Open a result | Filters in URL, sort semantics, empty/error/pagination |
| `/discover` | Discovery | Canonical alias or redirect to catalog | Discover stories | One canonical route; no duplicate index page |
| `/search` | Search | Query results and filters | Open result | Noindex query policy, clear query, keyboard suggestions, no results |
| `/genres` | Taxonomy | Genre directory | Browse genre | Empty taxonomy, locale, canonical metadata |
| `/tags` | Taxonomy | Tag directory | Browse tag | Empty taxonomy, locale, canonical metadata |
| `/trending` | Discovery | Period-defined popular stories | Open story | Metric and time window shown; no invented totals |
| `/for-you` | Personalization | Personalized recommendations | Open recommendation | Signed-out fallback, noindex, explain sparse data |
| `/made-for-you` | Personalization | Compatibility alias or unique defined screen | Open recommendation | Resolve overlap with /for-you; redirect only after link audit |
| `/leaderboard` | Discovery/Community | Period and dimension rankings | Open ranked story | Weekly/monthly window correctness, tie behavior, no fabricated rank |
| `/tier-list` | Community | User/community tier lists | View or contribute | Submission policy, moderation, empty state |
| `/random` | Discovery utility | Random eligible story | Open selected story | Exclude unpublished/ineligible works; noindex utility |
| `/formats` | Content formats | Format directory | Browse format | Each format has a real destination and explanation |
| `/format/:formatSlug` | Content formats | Format landing page | Browse works | Validate known format; 404 unknown format; conditional index |
| `/novel/:novelId` | Story catalog | Story detail and chapter directory | Read/continue | Published + rights eligible; not found/forbidden; canonical |
| `/novel/:novelId/chapters` | Story catalog | Full chapter listing | Open chapter | Publication/access state; pagination if needed |
| `/read/:novelId/:chapterNumber` | Reader | Distraction-reduced chapter surface | Continue reading | Ownership/access check, RTL, progress save failure, adjacent chapters |
| `/library` | Reader account | Saved and active reading | Continue reading | Owner-only data, signed-out state, empty state |
| `/history` | Reader account | Recent reading activity | Resume story | Owner-only, clear-history confirmation, no public leakage |
| `/following` | Account/Community | Followed authors and works | Open followed item | Owner-only, empty state, unfollow confirmation |
| `/notifications` | Account | In-app notification inbox | Open related item / mark read | Unread/read, empty/error, owner isolation |
| `/account` | Identity | Account overview | Manage account | Session expiry, account role display, private noindex |
| `/profile` | Identity | Editable personal profile | Save profile | Private default, validation, preserved edits, owner-only |
| `/u/:username` | Public identity | Privacy-gated public profile | Open eligible work | Private profile 404, public DTO allowlist, no reading history |
| `/settings` | Identity/Preferences | Settings hub | Open settings section | Clear grouping, theme/language persistence, account sync errors |
| `/login` | Identity | Sign-in | Authenticate | Validation, rate limit, safe return path, errors |
| `/register` | Identity | Account creation | Create account | Validation, duplicate account, rate limit, accessible errors |
| `/tickets` | Commerce | Balance and ledger | View transaction details | Authenticated owner-only, accurate ledger, no payment promise |
| `/requests` | Reader/Community | Reader request submission and tracking | Submit/view request | Visibility and ownership rules, abuse/rate limit, status |
| `/community` | Community | Discussion/discovery landing | Join discussion | Public/private scopes, empty/moderation state |
| `/community-taxonomy` | Governance | Community taxonomy proposals | Submit proposal | Attribution, review state, abuse controls |
| `/author` | Creator | Private creator workspace entry | Open Studio/apply | Role gate, onboarding state, no public indexing |
| `/become-an-author` | Creator onboarding | Public explanation and application | Apply | Eligibility, application states, rights expectations |
| `/author/:username` | Public identity | Author profile and eligible works | Open author work | Public profile policy, only published rights-eligible works |
| `/admin` | Administration | Admin workspace | Open permitted admin task | Server role check, forbidden state, audit trail |
| `/omniportal` | OmniPortal | Disabled/approved connector surface | View approved sources | Must remain disabled until rights and provider gates pass |
| `/trend-factory` | Editorial intelligence | Trend research workspace | Review trend signal | Auth/role gate, metadata-only inputs, no chapter-body ingestion |
| `/privacy`, `/terms`, `/copyright` | Legal | Public policy documents | Read policy | Current policy content, canonical and accessible headings |

## Screen state contract

Every route that fetches data must explicitly handle:

1. Initial loading without blanking the shared navigation.
2. Empty data with a meaningful next step.
3. Request failure with retry and preserved filters/input.
4. Expired authentication with a safe return path.
5. Forbidden access without leaking whether another user's private record exists.
6. Not-found for invalid or deleted resources.
7. Partial data without fabricated placeholders.
8. Responsive layout and long translated text.
9. LTR and RTL where user-generated language requires it.
10. Keyboard and assistive technology behavior.

## Navigation contract

- Every visible navigation item resolves to a registered route or an explicit action.
- Active route state is exposed semantically, not only by color.
- Mobile bottom navigation must not cover reader controls, form submission or dialogs.
- Private destinations remain noindex, but robots metadata is not an authorization mechanism.
- Redirects must be based on an audit of existing internal links, bookmarks and canonical tags.
- Unknown routes must render a real not-found state rather than silently showing the homepage.

## Implementation sequence

### Gate A: source truth
- Extract the current Worker page map and client route dispatch from the same commit.
- Generate a machine-readable route/screen inventory from source.
- Compare every route to the screen owner and shell mapping above.
- Mark observed implementation separately from target screen requirements.

### Gate B: dedicated screen gaps
Prioritize routes currently mapped to a generic shell:
- Notifications and settings
- Trending and rankings
- Formats and format landing
- Community landing
- Creator onboarding and Author Studio entry
- Trend Factory
- Personalization

Do not build a duplicate page if a fully functional screen already exists in client code; verify it first.

### Gate C: runtime and UX verification
- Browser-test every route at 320, 390, 768 and desktop widths.
- Test reader, creator, anonymous and admin roles with isolated accounts.
- Test loading/empty/error/forbidden/not-found states.
- Verify RTL, keyboard focus, reduced motion and contrast.
- Link each route to a regression test and screenshot evidence.

### Gate D: release
- Full app regression and Cloudflare readiness checks.
- Worker dry-run.
- Fresh and legacy migration rehearsal where schema changes are involved.
- Staging smoke test and production behavior verification.
- No production migration or deploy based on a design checklist alone.

## Acceptance rule

A route is **complete** only when its route match, dedicated screen, role/ownership rules, data contract, all relevant states, accessibility, responsive behavior, SEO policy and automated or documented runtime evidence agree. A generic shell mapping is not completion.
