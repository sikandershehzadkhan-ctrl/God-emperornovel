# Imperial Novel — API Method Matrix Findings (01N-37)

**Audit date:** 3 November 2026  
**Audited source:** `main:src/index.js`  
**Source blob:** `237f4461135eb77258b7184e361ce9dfd9a140e9`  
**Machine-readable inventory:** `IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json`  
**Validation:** GitHub Actions route-registry workflow passed for the manifest and API matrix.

## 1. Inventory totals

| Item | Count |
|---|---:|
| Exact API path comparisons | 74 |
| Dynamic API route patterns | 14 |
| Exact routes with at least one path-only handler condition | 14 |
| Exact routes with multiple explicitly observed methods | 15 |

This is a static dispatcher inventory. It is not a complete OpenAPI contract, authorization certification, or proof of runtime behavior.

## 2. Exact path-only method gaps

The following exact path conditions have no explicit method check at one or more matching branches:

| Endpoint | Finding |
|---|---|
| `/api/health` | Has an early GET fast path, but a later compatibility branch also matches by path alone |
| `/api/taxonomy` | Delegates to `communityTaxonomy(req, env)`; helper method contract must be inspected |
| `/api/me` | Path-only response projection |
| `/api/config` | Path-only public configuration projection |
| `/api/genres` | Path-only catalog read |
| `/api/tags` | Path-only catalog read |
| `/api/public-authors` | Path-only public author aggregation |
| `/api/sources` | Path-only source registry projection |
| `/api/omni/status` | Path-only connector status projection |
| `/api/omni/search` | Path-only search handler |
| `/api/omni/resolve` | Path-only source URL resolver |
| `/api/omni/smart-unlock` | Path-only authenticated smart-unlock handler |
| `/api/novels` | Path-only published catalog query |
| `/api/admin/stats` | Path-only administrator stats handler |

**Interpretation:** these are explicit method-contract gaps in the dispatcher, not confirmed exploits. The delegated taxonomy helper may enforce methods internally. For other handlers, the route should declare an allowed method and reject unsupported methods consistently. The novel and chapter ID routes are also dynamic path-only handlers: they currently perform view-count writes while matching any method unless a surrounding layer blocks it.

## 3. Dynamic API route families

The machine-readable matrix records 14 dynamic patterns, including:

- Novel detail and chapter detail reads.
- Chapter unlock and novel batch unlock.
- Admin user role/verification updates.
- Author AI project reads/updates, blueprint/run/jobs actions.
- Author novel submission and editing.
- Author chapter editing and publication.
- Admin publishing novel/chapter updates, reordering and deletion.
- Donation and report review.
- Author application review.
- Admin request review.
- Connector authorization review.

The matrix preserves the source-observed method guards. In particular, the dynamic novel and chapter detail routes have no explicit method guard in the current dispatcher.

## 4. Routes with multiple observed methods

Several paths intentionally branch by method, including history, library, comments, ratings, reactions, requests, vote-novels, creator projects, author novels/chapters and admin connectors. These should remain separate method contracts. A single path does not imply a single permission level or response DTO.

## 5. Required hardening

1. Add a method allowlist for every API path and dynamic route family.
2. Return 405 with an accurate `Allow` header for unsupported methods.
3. Confirm `communityTaxonomy` enforces its own method contract.
4. Prevent view-count mutations on unsupported methods for novel/chapter detail routes.
5. Add per-route anonymous/reader/author/owner/moderator/admin tests.
6. Add cross-user ID substitution tests for history, library, bookmarks, tickets, notifications, profile, AI projects and creator-owned novels/chapters.
7. Add response DTO allowlist and private-cache assertions.
8. Add CSRF/origin and rate-limit tests for cookie-authenticated mutations.
9. Reconcile the current 1–5 rating API validation with the product's intended whole-number 1–10 scale before changing schema or UI.

## 6. CI and release boundary

The dedicated `route-registry-validation.yml` workflow now runs:

- `node scripts/test-route-registry.mjs`
- `node scripts/test-api-route-method-matrix.mjs`

Both checks passed on the route-registry branch. The broader source-validation workflow also passed on the same PR revision. Production deployment remains manual and was not invoked.

**No runtime API handler, database schema, production secret, or live Worker was changed by this audit.**
