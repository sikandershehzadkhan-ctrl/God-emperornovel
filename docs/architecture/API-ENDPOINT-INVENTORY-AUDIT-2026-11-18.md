# API Endpoint Inventory Audit

**Audit date:** 2026-11-19  
**Source:** `src/index.js`, `async function api(req, env)`  
**Source blob:** `7ed42bdfc9282bc31155047ff5454103ad58cd14`  
**Status:** Static inventory baseline. Not a security or API contract certification.

## Inventory counts

| Item | Count |
|---|---:|
| Distinct literal API path conditions | 74 |
| Literal path-condition occurrences | 92 |
| Distinct explicit literal method conditions | 77 |
| Dynamic API route families | 21 |
| Literal endpoints held for contract review | 74 |
| Dynamic endpoints held for contract review | 21 |

The machine-readable inventory is `docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json`. Its build regression test is `scripts/test-api-endpoint-inventory.mjs`.

## What the inventory records

- Exact literal paths and source line evidence.
- Explicit HTTP methods where the dispatcher directly checks `m`.
- Dynamic route expressions, including numeric IDs and named action suffixes.
- Nearby authentication-helper signals (`need(u)`, `admin(u)`, `author(u)`) where observed.
- Review flags for every endpoint, because route-level helper calls alone do not prove resource ownership or complete authorization.

## Important limitations found

Fourteen literal paths have at least one branch without an explicit method predicate. Those are recorded as method-unresolved rather than guessing their intended methods. A handler accepting a path without checking `m` is not automatically a deliberate GET contract.

The dynamic route inventory includes reader novel/chapter lookups, chapter unlock and batch unlock, author AI project actions, author novel/chapter operations, and administrator review/publishing/payment/connector operations.

The `/api/author/ai/projects/{id}` source explicitly checks the project's `owner_user_id` against the signed-in user (admins are exempt). This is a useful positive source signal, but it does not establish that all other author-owned resources use equally strong checks.

## Known duplicate: rating

The current source snapshot has three `/api/rating` path-condition occurrences: one GET and two POST declarations. Both POST declarations are visible in the baseline source scan. This is tracked as an integration dependency on the separate 1–10 rating work in PR #318 and its reserved migration dependency in PR #195. This foundation change deliberately does not edit the rating handler or migration.

## Required next audit

1. Confirm accepted methods and unsupported-method responses for all path branches.
2. Trace delegated handlers such as `communityTaxonomy` and `adminTaxonomy`.
3. Review every authenticated mutation for resource ownership in its SELECT/UPDATE/DELETE predicates.
4. Test cross-account isolation for library, history, bookmarks, follows, notifications, requests, author projects, novels, and chapters.
5. Record request validation, response shapes, status codes, rate limits, CSRF/session assumptions, and abuse controls.
6. Reconcile the API calls made by `public/app.js` against the Worker dispatcher.
7. Refresh this inventory after the rating integration is merged.

No live API calls, production deployment, or D1 mutation were performed. Static source inspection cannot certify deployed behavior.

## Additional source hardening in the foundation branch

- Taxonomy submitter identity is derived from the server-resolved session; client-provided identity fields are ignored.
- Reader history writes validate positive safe-integer identifiers and the exact published, rights-eligible novel/chapter pair.
- New connector registrations start disabled and pending until explicit rights evidence and review.
- Build-gated source contracts now check account-scoped predicates, selected author/admin guards, and these resource-validation behaviors. These tests do not replace D1-backed two-user adversarial tests.

- Public taxonomy submissions are now rate-limited by IP and authenticated account; the regression contract is build-gated.
