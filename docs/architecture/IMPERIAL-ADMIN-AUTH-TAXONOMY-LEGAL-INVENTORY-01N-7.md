# Phase 01N.7 — Dedicated Admin, Taxonomy, Authentication and Legal Shell Inventory

Status: source-backed first-pass inspection of dedicated shells completed. Admin inline script and community taxonomy submit behavior were inspected. This inventory does not replace server-side handler review or browser/permission tests.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`

## 1. Admin command center — `/admin`

- **Shell:** `public/admin.html`, blob `67a4624a4e439ca3ad62c73313d3b72e109ce66a`.
- **Script:** one inline script, 30,465 characters; no external script source.
- **Client boot gate:** calls `GET /api/me`; renders the admin console only when `me.user.role === 'admin'`; otherwise replaces the page with an access-denied message. This is a client gate only; every admin API must independently enforce admin authorization.
- **Tabs / functional areas:** overview, users, author applications, taxonomy, publishing, community moderation, donations, requests, reports, agents, connectors and connector authorization requests.
- **Observed DOM anchors:** `#identity`, `#tabs`, `#overview`, `#stats`, `#users`, `#authorApplications`, `#taxonomy`, `#community`, `#publishing`, `#donations`, `#requests`, `#reports`, `#agents`, `#connectors`, `#connectorRequests`.
- **Observed API path/method references:**
  - `GET /api/admin/publishing`
  - `GET /api/admin/publishing/chapters?novel_id=`
  - `GET /api/admin/publishing/chapters/`
  - `POST /api/admin/publishing/chapters/reorder`
  - `GET /api/admin/publishing/novels/`
  - `POST /api/admin/publishing/novels`
  - `POST /api/admin/publishing/chapters`
  - `GET /api/me`
  - `GET /api/admin/stats`
  - `GET /api/admin/users`
  - `POST /api/admin/tickets`
  - `GET /api/admin/users/`
  - `GET /api/admin/community/comments`
  - `GET /api/admin/community/reports`
  - `PATCH /api/admin/community/reports`
  - `PATCH /api/admin/community/comments`
  - `GET /api/admin/author-applications?status=pending`
  - `GET /api/admin/author-applications/`
  - `GET /api/admin/taxonomy`
  - `POST /api/admin/taxonomy`
  - `GET /api/admin/donations`
  - `GET /api/admin/donations/`
  - `GET /api/admin/requests`
  - `GET /api/admin/requests/`
  - `GET /api/admin/reports`
  - `GET /api/admin/reports/`
  - `GET /api/admin/agents`
  - `POST /api/admin/agents/run`
  - `GET /api/admin/connectors`
  - `POST /api/connector-authorization-requests`
  - `PATCH /api/admin/connectors`
  - `POST /api/admin/omni/health`
  - `GET /api/admin/connector-authorization-requests`
  - `GET /api/admin/connector-authorization-requests/`
  - `POST /api/admin/connectors/cleanup`
- **Action families:** inspect aggregate dashboard; view/manage users; credit Imperial Crowns; ban/unban accounts; review creator applications; moderate comments and reports; review taxonomy proposals; review/publish/archive novels; create/edit/reorder/publish/unpublish/delete chapters; review donations and requests; manage reports; run approved agents; manage provider connectors and authorization requests; run connector health checks and cleanup.
- **Critical security gates:** admin authorization must be enforced in Worker handlers, not trusted from the browser role check. Crown credits, bans, publishing, deletion, provider connector changes and moderation actions need actor attribution, audit records, input validation, CSRF/session protection as applicable, rate limits and object-level authorization. Destructive chapter deletion and publication changes require server-side invariants and safe confirmation.

## 2. Community taxonomy proposal — `/community-taxonomy`

- **Shell:** `public/community-taxonomy.html`, blob `3535ec9b432cc2f9d303b21c6f8a418c8a69122a`.
- **Client behavior:** one form validates a normalized name length of 2–80 characters, then submits `POST /api/taxonomy` with `type`, `name`, `description` and `creator_name`.
- **DOM anchors:** `#taxonomy-form`, `#type`, `#name`, `#description`, `#creator-name`, `#taxonomy-submit`, `#taxonomy-status`.
- **User actions:** propose a taxonomy item; receive pending/review messaging; retry after connection failure.
- **Required checks:** server must validate allowed taxonomy types, normalize names, enforce moderation status and rate limits, prevent duplicate submissions and avoid trusting client-supplied creator identity. Public proposals must not become active taxonomy until approved.

## 3. Login and registration

- **Shells:** `public/login.html` and `public/register.html`, both load the shared `/app.js` bootstrap.
- **Renderer:** `authPage('login')` and `authPage('register')`.
- **DOM anchors:** `#app`, `#auth`, `#authMsg`.
- **Observed API family:** `POST /api/auth/login` and `POST /api/auth/register`.
- **Form fields:** email and password for login; email, username, password and confirmation for registration. Client enforces password length of at least eight characters and matching confirmation.
- **Required checks:** server-side validation, password hashing, rate limiting, safe session issuance/cookie attributes, generic login errors where appropriate, duplicate-account handling, and no trust in client-side confirmation checks. Verify registration/login CSRF and session rotation behavior against the actual auth handler.

## 4. Static legal shells

| Shell | Blob | Bytes |
|---|---|---:|
| `public/privacy.html` | `b7cf8eb120faf30ed90769cd76801a6a1b34e6b7` | 3931 |
| `public/terms.html` | `9b60dae2de0b539b3ba3cf40f89d2855dbe1ab6e` | 3440 |
| `public/copyright.html` | `112bcff8e2f80173d108da2bb8ac51ded4190e5c` | 2691 |

The existence of legal pages is verified; legal sufficiency, current terms, policy alignment, attribution and jurisdiction-specific compliance have not been audited in this pass.

## 5. Phase 01N.7 completion

- [x] Inspect admin shell and inline client script.
- [x] Record admin role check and distinguish it from server authorization.
- [x] Inventory admin functional tabs and API method/path references.
- [x] Inspect taxonomy proposal form and POST behavior.
- [x] Inspect login/register shells and shared auth renderer/API family.
- [x] Verify privacy, terms and copyright shell files exist.
- [ ] Inspect Worker admin route handlers and permission predicates.
- [ ] Inspect taxonomy handler validation, moderation and duplicate protection.
- [ ] Inspect auth handlers, session cookie settings and rate limiting.
- [ ] Test unauthorized user, author, suspended user and admin access boundaries.
- [ ] Audit legal content against actual platform behavior and rights policy.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.

## Next

Phase 01N.8: consolidate every observed API endpoint into a route/method/request-response/permission/cache matrix, then compare each entry with its actual Worker handler and tests. This is the main remaining evidence gate before architecture can be called complete.
