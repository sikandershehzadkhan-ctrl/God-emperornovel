# API Resource Ownership Review: First Pass

**Audit date:** 2026-11-18  
**Source:** `src/index.js` at foundation branch snapshot  
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

### 1. Comic chapter policy consistency

<badge>Resolved in PR branch</badge>

The author chapter PATCH handler now loads the parent novel's content format and calls `validateComicChapterContent(content)` for comic formats, matching the create path. Invalid content is rejected rather than silently rewritten. A regression assertion covers the shared validator call.

### 2. Bookmark write validation

<badge>Resolved in PR branch</badge>

`POST /api/bookmark` now validates positive safe-integer novel/chapter identifiers and confirms that the requested chapter number belongs to that novel, with both chapter and novel published and the novel rights-eligible. The write remains scoped to the authenticated `u.id`. Regression assertions cover the identifier and resource relationship checks.

### 3. Partial chapter update integrity

<badge>Resolved in PR branch</badge>

The author chapter PATCH handler now preserves the existing lock state when `is_locked` is omitted and rejects ticket costs that are not safe integers in the range 0 through 1,000,000. This prevents a title/body-only edit from implicitly unlocking a chapter and aligns update validation with reader unlock constraints.

### 4. Cross-account isolation still needs executable tests

Static SQL inspection shows multiple user-id predicates, but it does not prove that no alternate code path leaks data. Add tests with two independent users for library, history, bookmarks, follows, notifications, ticket ledger, novel requests, author applications, AI projects, novels, and chapters.

## Security boundary

No confirmed cross-user data exposure was established by this first pass. The two findings above are validation/policy consistency issues. This audit does not certify CSRF protections, rate limits, method rejection, session rotation, or all delegated handlers.

No production deployment, D1 mutation, or live API test was performed.
