# API Resource Ownership Review

**Audit date:** 2026-11-18  
**Reviewed branch:** `fix/taxonomy-submitter-identity`  
**Reviewed head:** `e4c3adcfec8d1c0f9c15f711e328660d3be97ec8`  
**Source:** `src/index.js` plus executable Worker-fetch tests  
**Scope:** Reader-owned data, author-owned works and projects, taxonomy submitter identity, administrative route access, literal and dynamic API method contracts.

## Ownership controls observed

| Surface | Control | Verification |
|---|---|---|
| Session identity | Session token is hashed for lookup; banned and expired users are rejected | Static source contract |
| Authenticated routes | `need(u)` requires a resolved session user | Static source contract and authenticated Worker-fetch tests |
| Admin routes | `admin(u)` requires the administrator role | Two-account Worker-fetch test denies ordinary readers on 23 admin read/write routes |
| Author routes | `author(u)` requires author or administrator access | Static source contract and two-author Worker-fetch tests |
| History and library | Reads and writes use the authenticated `u.id` | Two-account Worker-fetch tests |
| Bookmarks | Reads and writes use `u.id`; writes validate positive IDs and a published, rights-eligible novel/chapter relationship | Two-account Worker-fetch test, including invalid ID and mismatched chapter rejection |
| Follows and notifications | User-specific reads and mutations use `u.id` | Two-account Worker-fetch tests |
| Ticket ledger | Ledger reads are filtered by `user_id=u.id` | Two-account Worker-fetch test |
| Recommendations | Personalized rows are filtered by `recommendations.user_id=u.id`; fallback excludes works followed by the same user | Two-account Worker-fetch test and public-rights eligibility tests |
| Weekly novel-request usage | Usage count is filtered by `user_id=u.id` and current week | Two-account Worker-fetch test |
| Author application status | Application lookup is filtered by `user_id=u.id` | Two-account Worker-fetch test |
| Author novels and chapters | Creation derives owner from session; read/update/publish paths check parent novel ownership | Two-author Worker-fetch tests |
| Author AI projects | List/detail/update/blueprint/run/jobs paths enforce project owner, with administrator exemption | Two-author Worker-fetch tests |
| Taxonomy proposals | Creator ID comes from the resolved session user; anonymous proposals store null; caller-supplied creator IDs are ignored | Worker-fetch test for authenticated and anonymous submissions |
| Admin resources | Administrative read/write routes reject ordinary reader credentials | Two-account Worker-fetch test covering 23 admin routes |

## Findings from the first pass and resolution status

### 1. Comic chapter policy was inconsistent on edit

**Resolved in this branch.** The author chapter PATCH route now loads the parent novel's format and applies `validateComicChapterContent(content)` for comic formats before persistence. The runtime test verifies malformed comic edits return 400 without saving and valid page-sequence JSON can be edited.

### 2. Bookmark writes lacked target validation

**Resolved in this branch.** `POST /api/bookmark` now validates positive safe-integer novel and chapter values, confirms the novel is published and rights-eligible, and confirms the published chapter belongs to that novel before writing. The authenticated session remains the source of bookmark ownership.

### 3. Cross-account isolation needed executable tests

**Expanded in this branch.** Worker `fetch()` tests exercise two independent reader accounts and two author accounts across history, library, bookmarks, follows, notifications, recommendations, weekly novel-request usage, ticket ledger, author application status, author novels, author chapters, author AI projects, and taxonomy attribution.

The tests use deterministic D1 test doubles. They exercise the actual Worker request handler and assert response/data boundaries, but they are not integration tests against Cloudflare's production D1 service.

## HTTP method contract review

- All 13 literal API paths previously marked method-unresolved now have explicit method enforcement or a delegated handler that explicitly rejects unsupported methods.
- The 21 dynamic route families now record allowed methods, exact method-guard source lines, access class, and resource-scope notes in `API-ENDPOINT-INVENTORY-2026-11-18.json`.
- Public novel and chapter detail routes now explicitly require GET.
- The inventory build test verifies method evidence against the corresponding source lines.

## Remaining security boundaries

This review does not certify every security property. Separate work is still required for full CSRF analysis, rate-limit coverage, session rotation/revocation behavior, abuse controls, production D1 behavior under real Cloudflare semantics, and browser-level authorization flows. Dynamic route families remain flagged for continued contract review even though their current methods and access scopes are documented.

## Validation boundary

At reviewed head `e4c3adcfec8d1c0f9c15f711e328660d3be97ec8`, the Cloudflare Source Validation workflow passed, including the application build, Worker bundle dry-run, production safety checks, and all 11 migrations against a fresh SQLite database. Graphify also passed.

No production D1 data was changed. No production deployment or live browser QA was performed. This document records repository and CI evidence only.
