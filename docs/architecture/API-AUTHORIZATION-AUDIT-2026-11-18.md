# API authentication and authorization audit: first 14 paths

Audit date: 2026-11-18

## Evidence boundary

This review covers the 14 literal routes that previously had no explicit method condition and now have centralized method guards. It is a source-level review of `src/index.js` and a literal-string scan of `public/app.js`. It does not certify every API route or dynamic route family.

Authentication helpers inspected:

- `getUser(req,env)`: resolves the session cookie to a user, rejecting missing, expired, or banned sessions.
- `need(user)`: returns 401 when no authenticated user exists.
- `admin(user)`: returns 403 unless the user role is `admin`.
- `author(user)`: permits `author` or `admin`.

Except for the early `/api/health` fast path, the API dispatcher performs schema setup and then optional session lookup before route branches. A route classified as public does not require a valid session, even though an optional cookie may be read.

## Route matrix

| Route | Method | Authentication / role | Data scope and behavior | Client literal hits |
|---|---|---|---|---:|
| `/api/health` | GET | Public; bypasses session lookup | Lightweight database probe and service metadata | 0 |
| `/api/taxonomy` | GET | Public | Approved genre/tag vocabulary only | 0 |
| `/api/taxonomy` | POST | Authenticated account required | New proposal; submitter ID/name derived from session, not request body | 0 |
| `/api/me` | GET | Optional session | Returns only the current session user's profile summary, or null | 5 |
| `/api/config` | GET | Public | Public site/payment configuration; payment reports unavailable | 0 |
| `/api/genres` | GET | Public | Genre vocabulary | 1 |
| `/api/tags` | GET | Public | Tag vocabulary | 1 |
| `/api/public-authors` | GET | Public | Aggregated authors from published, rights-eligible novels | 0 |
| `/api/sources` | GET | Public | Static connector/source registry metadata | 0 |
| `/api/omni/status` | GET | Public | Connector registry status; calls `seedOmni`, which ensures tables and seeds registry rows | 0 |
| `/api/omni/search` | GET | Public | Local search plus enabled connectors marked rights-authorized | 1 |
| `/api/omni/resolve` | GET | Public | Validates and resolves a supported source URL; no user-owned resource | 0 |
| `/api/omni/smart-unlock` | GET | Authenticated account required | Calculates the current user's remaining locked chapters and affordable packs for a published, rights-eligible novel; does not perform an unlock | 0 |
| `/api/novels` | GET | Public | Catalog query restricted to published, rights-eligible novels | 13 |
| `/api/admin/stats` | GET | Administrator only | Aggregate platform statistics | 0 |

Client literal hits count exact path-string occurrences in `public/app.js`. Zero hits do not prove an endpoint is unused: callers may construct paths, use another runtime, or call it outside this file. These counts are discovery hints, not a complete API-client reconciliation.

## Confirmed remediation

### Taxonomy submitter spoofing

Before this audit, taxonomy POST accepted `creator_id` and `creator_name` from the request body. The handler now calls `need(user)` before reading the body and writes `user.id` and `user.username`. This removes the client-controlled identity path.

### Method handling

All 14 routes now reject unsupported methods with HTTP 405 and an `Allow` header before schema bootstrap and session lookup. Taxonomy allows GET and POST; the other 13 routes allow GET only.

## Additional author-resource update finding

### Partial chapter edits must not change lock state implicitly

The author chapter PATCH handler previously converted an omitted `is_locked` field to false through a truthiness expression. A client updating only a title or chapter body could therefore unintentionally unlock the chapter. The same handler accepted ticket costs without requiring a bounded whole number, unlike the reader unlock path's safe-integer validation.

The handler now preserves the stored lock state when `is_locked` is absent and validates ticket cost as a safe integer from 0 through 1,000,000. A source regression assertion protects both behaviors. This is a verified input/update-integrity defect and remediation in the PR branch, not a demonstrated cross-account data exposure.

## Remaining security and operational questions

1. **Public Omni search exposure:** `/api/omni/search` can query enabled, rights-authorized external connectors for anonymous callers. Confirm request-size bounds, per-IP rate limiting, concurrency limits, and provider-abuse controls before enabling connectors in production.
2. **Public Omni status side effects:** `/api/omni/status` is a public GET that calls `seedOmni`, which can create schema and seed registry rows. Prefer moving initialization to a controlled setup/migration path or prove this bootstrap is bounded and safe under concurrent anonymous requests.
3. **Taxonomy submission abuse:** POST now requires login and binds identity correctly, but per-account/IP submission rate limits and moderation abuse controls still need review.
4. **Client parity:** Several routes have no exact literal reference in `public/app.js`; trace dynamic callers and other frontend bundles before calling them unused.
5. **Remaining routes:** This report does not cover the other literal routes or the 21 dynamic route families.

## Status

- Method behavior for these 14 paths: **implemented and CI-verified**.
- Taxonomy submitter identity binding: **implemented and CI-verified**.
- Authentication/role behavior for these 14 paths: **source-reviewed; remaining abuse and operational controls listed above**.
- Full API authorization, resource ownership, cross-account isolation, and client parity: **not complete**.
- No production D1 access, production deployment, or live-browser test was performed.


## 2026-11-18 follow-up: public Omni endpoint abuse controls

- Public `GET /api/omni/status` is now IP-rate-limited to 60 requests per 60-second window and no longer seeds/writes connector registry rows. Registry seeding happens from the authenticated admin connector listing instead.
- Public `GET /api/omni/search` is now IP-rate-limited to 20 requests per 60-second window and rejects query strings longer than 120 characters before searching local content or contacting authorized connectors.
- External connector searches remain limited to enabled connectors with `rights_status='authorized'`, and the existing 7-second outbound fetch timeout remains in place.
- The rate-limit helper uses the existing D1-backed auth rate-limit table. This introduces bounded D1 writes for public requests; it is not a substitute for Cloudflare edge/WAF controls, and the shared `unknown` IP fallback must be reviewed if requests can reach the Worker without `cf-connecting-ip`.
- Regression coverage is source-level in `scripts/test-api-authorization-audit.mjs`; exact-head CI and production behavior remain unverified until the build workflows pass and the Worker is deployed.
