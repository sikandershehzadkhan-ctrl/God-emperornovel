# Imperial Novel | Phase 01P.6: Delegated Handler and Helper Audit

**Branch:** `architecture/phase-01m-screen-blueprint`  
**Audited source:** `src/index.js`, SHA `13874ee0fde4e31e04a652c5169776c3b6f95c38`.  
**Scope:** Exact helper-level method, guard, ownership, side-effect and error behavior for taxonomy handlers, plus shared coarse authorization functions.  
**Status:** Source inspection only. No runtime tests executed.

## 1. Shared authorization helpers

| Helper | Source | Exact behavior | Security interpretation |
|---|---:|---|---|
| `need(u)` | 371 | Returns 401 when `u` is falsy; otherwise null | Authentication-only check; no permission, account-state, verification or resource scope |
| `admin(u)` | 372 | Allows only `u?.role === "admin"`; otherwise 403 | Single global admin role; no scoped staff permissions or separation of duties |
| `author(u)` | 373 | Allows `admin` or `author`; otherwise 403 | Coarse author entitlement; ownership still must be checked by each handler |

The API dispatcher calls `getUser(req,env)` before the route branches (source line 452), after schema bootstrap. The helper checks above are not a replacement for route-level ownership or account-state policy.

## 2. `GET /api/taxonomy`

**Dispatch:** `src/index.js:456` delegates to `communityTaxonomy(req,env)`.  
**Handler:** lines 401-426.

Observed behavior:
- Supports GET explicitly.
- Requires `type=genre` or `type=tag`; otherwise 400.
- Defaults status to approved and rejects any requested status other than approved with 403.
- Selects only public taxonomy fields, sorted by name, limited to 500.
- Does not expose pending/rejected submissions or submitter fields in the GET response.
- Unsupported methods return 405.

**Observed guard:** no authentication required for GET. This is consistent with public approved taxonomy discovery.

**Target permission:** `taxonomy.approved.read`.

**Tests:** approved-only visibility; unknown type; explicit pending/rejected filter; maximum result bound; unsupported methods return 405; malformed query values.

## 3. `POST /api/taxonomy`

**Dispatch:** same route at line 456.  
**Handler:** lines 415-425.

Observed behavior:
- Supports POST explicitly.
- Does **not** call `need(u)` or otherwise require authentication in this helper.
- Validates type and normalized name length (2-80).
- Checks the official taxonomy table for existing slug.
- Checks for an existing submission with same type/slug.
- Inserts a pending submission.
- Critically, copies `creator_id` and `creator_name` from the request body rather than deriving them from the authenticated session.
- Description is truncated to 500 characters.
- Insert exceptions return a generic 500 response and log a server-side error.
- Unsupported methods return 405.

**Confirmed security finding:** caller-controlled submitter identity fields can be written to the taxonomy submission row. Since `getUser` is available in the parent API handler but not passed to `communityTaxonomy`, the helper cannot safely attribute a signed-in submitter from the current user object. This is an attribution-integrity issue; it is not evidence that the caller can gain permissions.

**Required decision before implementation:**
1. Decide whether anonymous taxonomy suggestions are allowed.
2. If anonymous submissions are allowed, store an explicit anonymous/null actor and ignore caller-supplied `creator_id` and `creator_name`.
3. If signed-in submissions are required, pass the authenticated actor and derive attribution server-side.
4. Store immutable submitter attribution separately from display labels where practical.

**Target permission:** `taxonomy.suggestion.submit` with explicit anonymous policy if desired.

**Priority:** P1. Tests must prove spoofed creator IDs/names are ignored and attribution cannot impersonate another account.

## 4. Admin taxonomy review

**Dispatch:** GET at line 457; POST delegates at line 458.  
**Handler:** `adminTaxonomy(req,env,u)`, lines 427-435.

Observed behavior:
- Calls `admin(u)` internally, so the helper itself enforces current global admin role.
- Reads request body fields `id` and `decision`.
- Allows only approve/reject.
- Loads submission and requires current state pending.
- Reject path updates status, reviewer ID and review timestamp.
- Approve path inserts into `genres` or `tags` using a table selected from the validated submission type, then updates submission to approved with reviewer ID/time.
- Already-reviewed rows return 409.
- No explicit audit-event call is visible in this helper.
- The approve insert and submission update are separate D1 operations, not one explicit transaction/batch in this helper.
- No conditional `UPDATE ... WHERE status='pending'` is visible; concurrent reviewers can race between read and write.

**Confirmed design risks:**
- Global admin is the only role boundary.
- No explicit conflict-of-interest check prevents the submitter from reviewing their own suggestion.
- Approval insert and status update are not visibly atomic.
- Concurrent review race needs a conditional state transition or transaction.
- No explicit audit event is visible in this helper.

**Target permissions:** `taxonomy.review.read` and `taxonomy.review.decide`, with scoped assignment and independent reviewer policy where required.

**Priority:** P1. Add tests for non-admin denial, self-review denial, two concurrent approvals, approve/reject race, duplicate slug, insert failure between steps, audit failure and repeated decision.

## 5. Updated operation registry corrections

The Phase 01P.5 entries should be interpreted with these exact details:

| Operation ID | Confirmed method | Guard | Correction |
|---|---|---|---|
| API-005 | GET and POST | GET public; POST no authentication guard in helper | Split into API-005A GET and API-005B POST in the next registry normalization |
| API-006 | GET | admin | Confirmed |
| API-007 | POST | admin inside helper | Confirmed; add race, self-review and audit tests |

API-005 POST must not be described as authenticated merely because the parent dispatcher obtains a user object. The handler does not enforce that object.

## 6. New tests to add to Phase 01P.3

| ID | Request | Expected result |
|---|---|---|
| TAX-001 | POST taxonomy with `creator_id` set to another user's ID | Server ignores supplied identity; stored actor is authenticated actor or explicit anonymous |
| TAX-002 | POST taxonomy with forged `creator_name` | Server derives display attribution or stores anonymous; no impersonation |
| TAX-003 | POST taxonomy with no session | Result matches the explicitly approved anonymous-submission policy |
| TAX-004 | GET taxonomy with status=pending | 403; no pending submission data |
| TAX-005 | GET taxonomy with status=rejected | 403; no rejected submission data |
| TAX-006 | POST admin review as non-admin | 403; no state change |
| TAX-007 | Submitter attempts to approve own suggestion | Denied under target policy |
| TAX-008 | Two reviewers approve same submission concurrently | Exactly one conditional transition; one canonical taxonomy insert |
| TAX-009 | One reviewer approves while another rejects | Exactly one terminal state wins; no inconsistent official taxonomy |
| TAX-010 | Force official taxonomy insert failure | Submission remains pending; no partial approved state |
| TAX-011 | Audit persistence fails during review | Review fails closed or remains recoverably pending |
| TAX-012 | Unsupported HTTP method | 405; no side effect |

## 7. Remaining Phase 01P.6 scope

This document closes only the taxonomy helper and shared coarse-guard evidence gap. It does not close:
- `/api/novels` nested method branches.
- Community comments, reactions and votes.
- Donation and payment request handlers.
- Author application review dynamic route.
- Author AI project and analytics ownership.
- Publishing dynamic routes.
- Connector cleanup and authorization review.
- Imported helper functions invoked by agent, OmniPortal or provider workflows.

These remain explicit follow-up items. Do not label the entire route inventory exhaustive.

## 8. Safety boundary

Architecture evidence only. No runtime code, permission behavior, database schema, production data, credentials, Cloudflare settings, branch merge or deployment changed. No tests were executed.
