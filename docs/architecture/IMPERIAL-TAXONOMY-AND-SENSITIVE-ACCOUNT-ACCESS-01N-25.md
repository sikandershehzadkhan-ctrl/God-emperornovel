# Imperial Novel: Taxonomy Attribution and Sensitive Account Access 01N-25

**Phase:** 01N isolated P0 security implementation
**Status:** Implemented and CI-verified on integration branch
**Validated head:** `4a673103fcbbec4b74290879f63a2f658120f644`
**Production:** Not deployed

## 1. Taxonomy submission identity

Previously, taxonomy submissions accepted `creator_id` and `creator_name` directly from request JSON and the POST route did not require authentication. That allowed submitter attribution to be spoofed.

Changes:
- The taxonomy handler now receives the authenticated session principal.
- Public GET remains available for approved vocabulary only.
- POST requires an authenticated session and returns the normal authentication error when absent.
- `creator_id` and `creator_name` are derived from the session user; request-body identity fields are ignored.
- Existing input validation, duplicate checks and pending-review flow remain in place.

## 2. Sensitive account records

`GET /api/admin/users` previously allowed any generic administrator to list up to 500 accounts including email, ticket balance, verification and ban state.

Changes:
- The endpoint now requires the configured platform-owner identity, not merely the generic `admin` role.
- If the owner identity is not configured, the endpoint fails closed with HTTP 403.
- Other admin workflows remain separate; this change does not grant any user new privileges.

## 3. Regression tests

- Source regression tests assert authenticated taxonomy submission, session-derived attribution, ignored spoofable request fields, and owner-only account listing.
- The local Wrangler+D1 HTTP smoke test now sends an unauthenticated taxonomy POST with spoofed creator fields and requires HTTP 401.

CI passed on the exact validated head:
- [Cloudflare Source Validation run 41315381193](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41315381193), including the local Worker+D1 HTTP smoke step.
- [Graphify architecture map run 41315381113](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41315381113).

## 4. Remaining controls

- The owner account ID must still be established through a controlled read-only verification process before production configuration.
- Owner step-up authentication, recovery controls and comprehensive role/permission matrix remain outstanding.
- Add authenticated HTTP tests using real local test sessions for owner, generic admin, moderator and ordinary user cases.
- Add request-rate limits and abuse controls to taxonomy submissions.
- Complete broader API response privacy and IDOR/BOLA review.

## 5. Release disposition

- PR #123 remains draft and unmerged.
- No changes merged to `main`.
- No production D1 migration or Cloudflare deployment.
- Local D1 only; no production secrets or owner identity were configured.