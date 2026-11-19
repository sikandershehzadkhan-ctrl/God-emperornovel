# API Resource Ownership Review: First Pass

**Audit date:** 2026-11-19  
**Source:** `src/index.js` at foundation branch snapshot (`7ed42bdfc9282bc31155047ff5454103ad58cd14`)  
**Scope:** User-scoped reader data, author-owned works, AI projects, and administrative mutations. Static source review only.

## Positive ownership controls observed

| Surface | Source evidence | Observed control |
|---|---|---|
| Session identity | `getUser(req, env)` | Resolves session token hash; rejects missing, banned, or expired users |
| Authenticated routes | `need(u)` | Requires a resolved user |
| Admin routes | `admin(u)` | Requires exact `role === "admin"` |
| Author routes | `author(u)` | Allows admin or author role |
| History and library | `/api/history`, `/api/library` | Reads and mutations bind `user_id` to `u.id` |
| Bookmarks | `/api/bookmark`, `/api/bookmarks` | Reads and writes are scoped to `u.id` |
| Follows and notifications | `/api/follow`, `/api/follows`, `/api/notifications` | User-specific rows use `u.id` |
| Author novel workspace | `/api/author/novels` | List filters `owner_user_id=u.id`; create assigns `owner_user_id=u.id`; update loads the row and checks its owner |
| Author chapters | `/api/author/chapters` and ID routes | List/create checks parent novel ownership; update/publish checks chapter's parent novel owner |
| Author AI projects | `/api/author/ai/projects` and ID actions | Project read/update/run/blueprint/jobs paths check `owner_user_id`, with admin exemption |
| Admin publishing and review | `/api/admin/*` | Admin helper appears before administrative mutations |

These are source-level positive signals. They do not replace adversarial cross-account tests.

## Findings requiring follow-up

### 1. Comic chapter policy is not applied consistently on edit

- `POST /api/author/chapters` calls `validateComicChapterContent(content)` when the parent novel uses a comic format.
- `PATCH /api/author/chapters/{id}` checks the chapter's parent novel ownership, but does not call the same comic-content validator before saving.
- The shared validator enforces the supported page-sequence JSON shape, public HTTPS image URLs, maximum 300 pages, per-field limits, and a 95 KB chapter limit.

**Impact:** An author can create a valid comic chapter and later edit it into a payload that the creation route would reject. This is a content-integrity and policy-consistency gap, not evidence of cross-account access.

**Recommended correction:** Apply the same format-aware validator to chapter edits, and add a regression test that proves invalid comic content is rejected by both create and update paths. Do not silently rewrite existing chapter data.

### 2. Bookmark write validation is weaker than neighboring reader endpoints

- `POST /api/bookmark` requires authentication and scopes the write to `u.id`.
- It directly accepts `novel_id` and `chapter_number` from the request body without first checking that the novel/chapter exists, is published, and is rights-eligible, or that the chapter belongs to the supplied novel.

**Impact:** This appears to be an input/data-integrity gap in the user's own bookmark record. The write is still scoped to the authenticated user in the observed SQL.

**Recommended correction:** Validate positive integer IDs, confirm the published rights-eligible novel and matching chapter, and test invalid/mismatched IDs.

### 3. Cross-account isolation still needs executable tests

Static SQL inspection shows multiple user-id predicates, but it does not prove that no alternate code path leaks data. Add tests with two independent users for library, history, bookmarks, follows, notifications, ticket ledger, novel requests, author applications, AI projects, novels, and chapters.


### 3. Taxonomy submission identity could be spoofed

- The public `POST /api/taxonomy` handler accepted `creator_id` and `creator_name` directly from the request body.
- This allowed a caller to attribute a pending proposal to another account or arbitrary display name. It did not grant moderation privileges, but it weakened attribution and audit integrity.
- The handler now receives the server-resolved session user and derives submitter ID/name from that session; anonymous submissions are recorded as `Guest`. Client-supplied identity fields are ignored. POST submissions are rate-limited by source IP and, when authenticated, by account.
- A build-gated regression contract asserts that the handler does not read `b.creator_id` or `b.creator_name`.

**Status:** Corrected in the foundation branch; runtime integration and abuse-rate testing remain outstanding.


### 4. Connector registration could bypass the evidence-first workflow

- The admin connector creation endpoint inserted new connectors with `rights_status='authorized'`, even though the record had no rights evidence or terms URL.
- The admin UI's separate authorization workflow explicitly asks for evidence and requires a review decision before a connector can be enabled.
- New connector registrations now start `pending` and disabled. The response states that rights review is required. The build-gated contract checks that only the explicit evidence-backed review flow can set the authorized state.

**Status:** Corrected in the foundation branch; actual connector-provider behavior and evidence verification remain human-review responsibilities.


### 5. Reader history accepted arbitrary chapter numbers

- The authenticated history write previously verified only that the novel was published and rights-eligible; it did not validate the chapter number or prove that the chapter belonged to that novel and was published.
- The handler now requires positive safe-integer novel/chapter values and verifies the published rights-eligible novel/chapter pair before writing progress.
- A build-gated regression contract covers invalid IDs, unpublished chapters, and mismatched chapter targets at the source-contract level.

**Status:** Corrected in the foundation branch; two-account runtime tests and live D1 verification remain outstanding.


### 6. Account-scoped source contract baseline

- Reviewed the source-level ownership predicates for reader history, library, bookmarks, follows, notifications, request quotas, author novel lists, and AI project lists.
- The build-gated `test-api-owner-scope-contract.mjs` asserts authenticated-user bindings, author guards, project/novel ownership checks, and admin-only guards for representative administrative routes.
- This improves regression coverage but does not prove cross-account isolation under runtime conditions; issue #335 remains open for two-user adversarial tests.

## Security boundary

No confirmed cross-user data exposure was established by this first pass. The two findings above are validation/policy consistency issues. This audit does not certify CSRF protections, rate limits, method rejection, session rotation, or all delegated handlers.

No production deployment, D1 mutation, or live API test was performed.
