# Password recovery security design

Status: provider-independent design and implementation gate. No reset endpoint is enabled by this document.

## Current repository findings

- Passwords are stored with PBKDF2-SHA-256 through `src/auth-password.mjs`.
- The current hash policy uses 120,000 iterations and a fresh 16-byte random salt.
- Login verifies the stored password hash and upgrades legacy hashes after successful authentication.
- Session credentials are stored as SHA-256 token digests in the `sessions` table.
- Login and registration have rate-limit controls.
- No password-reset route, reset-token table, or outbound email delivery binding/provider is currently configured in `wrangler.toml`.

Because no verified email delivery channel is configured, the application must not generate a reset token and expose it in an API response, browser page, URL, log, or analytics event. A recovery flow is not complete until the delivery channel is configured and tested.

## Required flow

1. `POST /api/auth/password-reset/request` accepts an email address and always returns the same generic success response for known and unknown addresses.
2. Apply independent IP and normalized-email rate limits. Do not reveal whether the account exists, is verified, suspended, or eligible.
3. For an eligible account with a verified email address, create a cryptographically random token with at least 256 bits of entropy.
4. Store only a keyed or cryptographic digest of the token, never the raw token. Bind the record to one user, one purpose, and a short expiry (recommended 20 minutes).
5. Deliver the raw token only through the verified email address using a configured provider. Never put it in logs or return it in an API response. The user agent receives it only through the email link's fragment, and the reset page must not load third-party resources that could read or leak that fragment.
6. `POST /api/auth/password-reset/complete` accepts token and new password, validates the token in constant time, and consumes it exactly once.
7. Update the password and revoke all sessions in one guarded database transaction/batch. Expire all outstanding reset tokens for that account.
8. Return a generic result and send a separate security notification after a successful change.

## Token and database rules

- Use Web Crypto secure randomness; never use timestamps, counters, `Math.random()`, or predictable identifiers.
- Store a SHA-256 digest of a high-entropy token, or HMAC-SHA-256 with a dedicated secret if one is provisioned.
- Store `user_id`, `token_hash`, `purpose`, `expires_at`, `created_at`, and nullable `consumed_at`.
- Enforce unique token hashes and index by user and expiry.
- Consume with a single conditional update such as `WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?`; require exactly one changed row.
- Never permit a token for one purpose to authorize another operation.
- Do not invalidate the current session merely because an unauthenticated reset email was requested. Revoke sessions only after a successful password reset.

## Abuse and privacy controls

- Generic response for every email address, including unverified and unknown addresses.
- Rate-limit both IP and normalized email; avoid permanent account lockout.
- Do not include the supplied email in logs, traces, or error telemetry.
- Use HTTPS-only links, strict host allowlisting, and a fixed configured public origin. Do not trust request Host or forwarded-host headers to construct reset URLs.
- Set no-store cache headers on reset pages and API responses.
- Do not send reset tokens to third-party analytics, referrers, or external image/script resources.
- Do not automatically change email addresses or account roles during recovery.
- Notify the account after successful password change, with no password or token in the notification.

## Email provider readiness gate

Before enabling recovery, configure an approved transactional email provider and verify:
- sender-domain ownership and SPF/DKIM/DMARC;
- provider secret stored as a Cloudflare secret, never in source control or `[vars]`;
- delivery, bounce, retry, timeout, and provider-outage behavior;
- link origin and redirect allowlist;
- no token leakage in provider logs beyond the provider's documented retention controls.

If delivery is unavailable, return the same generic response but do not create an unusable reset token. Provide a support path that does not disclose account existence.

## Required tests

- Unknown and known email requests have identical public response shape and status.
- Unverified addresses do not receive a reset link.
- Account A cannot use Account B's token.
- Expired, consumed, malformed, wrong-purpose, and tampered tokens are rejected.
- A token succeeds once under concurrent requests; the second attempt fails.
- Password policy is enforced using the existing `hashPassword` helper.
- Successful reset revokes every session for that account and no other account's sessions.
- Outstanding tokens are invalidated after a successful reset.
- Reset request alone does not revoke sessions or modify the password.
- No API response, application log, or analytics payload contains the raw token.
- Rate limits apply to both IP and normalized email without account enumeration.
- Provider outage does not expose tokens or create a false success state.
- D1 partial failures do not leave a changed password with active old sessions.

## Token and schema milestone (implemented)

- Added `src/password-reset-token.mjs` with 256-bit Web Crypto token generation, SHA-256 digest generation, and digest verification.
- Added `scripts/test-password-reset-token.mjs` and wired it into the standard build test chain.
- Added `migrations/0009_password_reset_tokens.sql` with a purpose-bound, unique token digest, expiry, consumption and invalidation fields, plus lookup indexes.
- Added `scripts/test-password-reset-migration-policy.mjs` to the standard build test chain.
- Added `src/password-reset-store.mjs` with a D1 batch primitive that conditionally consumes an unexpired token, changes only its bound account's password, revokes that account's sessions, and invalidates its other outstanding reset tokens.
- Added a unique random `consumption_id` for each completion attempt. Every follow-up statement is bound to that exact operation, preventing a replay from matching an earlier consumption merely because both requests share the same timestamp.
- Added `scripts/test-password-reset-store.mjs` to exercise account isolation, replay, expiry, purpose constraints, sibling-token invalidation, and rollback behavior using SQLite, plus the D1 binding contract.
- Added `src/password-reset-link.mjs` and `scripts/test-password-reset-link.mjs`. Reset links require an explicitly configured canonical HTTPS origin, reject credentials/path/query/fragment origin tricks, and place the token in the URL fragment rather than the request path or query.
- Added `migrations/0010_email_verification.sql` with a separate `email_verified_at` timestamp and purpose-bound email verification token table. The legacy `users.verified` field is an admin/creator badge and is explicitly not treated as proof of mailbox ownership.
- Added `scripts/test-email-verification-migration.mjs` to the build test chain. It checks the migration, token purpose constraint, and that existing badge state remains separate from mailbox verification.
- These primitives do not create live reset requests, send email, expose a reset endpoint, or enable password recovery. The raw token must be delivered only through a verified provider channel; only the digest is intended for persistence.
- CI must pass before this primitive is treated as validated.

## Implementation sequence

1. Implement email ownership verification using the dedicated `email_verified_at` field and verification-token table. Do not reuse the creator/admin badge.
2. Choose and configure a transactional email provider and verified sender domain.
3. Add request and completion endpoints with generic responses and rate limits.
4. Add two-account local Worker + D1 tests, including concurrency and failure cases.
5. Run the full Cloudflare validation workflow.
6. Keep password recovery disabled until provider delivery and the full test suite pass.

Password recovery is not considered complete until all six steps pass. No production secret, email, or deployment change is made by this design.


## Email ownership verification implementation notes

- `src/email-verification-token.mjs` creates 256-bit random verification tokens and exposes only SHA-256 base64url digests for persistence.
- `src/email-verification-store.mjs` completes verification in a D1 batch. A fresh consumption UUID binds the user update and invalidation statements to the exact token consumption.
- The email address stored in `email_snapshot` is compared against the account's current email at completion. If the address changed after token issuance, the token is consumed but the new address is not marked verified.
- Successful verification invalidates the account's other active email-verification tokens.
- `scripts/test-email-verification-store.mjs` covers token entropy and digest verification, one-time use, replay, account isolation, changed-email rejection, and preservation of the separate creator/admin badge.
- These are tested primitives only. No endpoint issues tokens, no mail is sent, and password recovery remains disabled pending a verified delivery provider and complete route-level tests.

## Provider-independent security email boundary

- `src/security-email-delivery.mjs` defines a provider-neutral contract through an optional Cloudflare Service Binding named `SECURITY_EMAIL`.
- The receiving service owns all provider-specific APIs and credentials. Provider secrets must not be placed in this application, source control, or ordinary Worker vars.
- Only the fixed `verify_email` and `reset_password` templates are accepted. Recipients are normalized, links must be HTTPS and match the explicitly configured canonical public origin, and every send requires a UUID idempotency key.
- The binding request is sent to the internal service URL with `cache-control: no-store`. The caller receives only `{ ok: true }` or a generic failure; provider response bodies and exception details are not exposed or logged.
- Missing binding, provider error, malformed response, timeout, and invalid request all fail closed. The helper does not claim delivery merely because a request was attempted.
- `scripts/test-security-email-delivery.mjs` tests missing binding, template allowlisting, recipient validation, canonical-origin binding, idempotency-key validation, provider failure, malformed response, and sanitized errors.
- No `SECURITY_EMAIL` binding is configured in `wrangler.toml`, and no provider has been selected or connected. Therefore no mail can be sent by this application yet.

### Activation requirements

Before adding a user-facing route, the receiving delivery service must be separately reviewed and configured with a verified sender, provider secret, strict template rendering, recipient policy, provider-side idempotency, bounce handling, and a documented data-retention policy. Then configure the Cloudflare Service Binding and test it in an isolated environment. Do not return account-existence information or expose action URLs in API responses.
### Action-link destination restrictions

- The delivery boundary now permits only `/verify-email` for `verify_email` and `/reset-password` for `reset_password`.
- Both actions must carry a 43-character base64url token exclusively in the URL fragment (`#token=...`). Query strings, off-origin links, other same-origin paths, and missing/malformed fragments are rejected before the service binding is called.
- The delivery contract tests include wrong-path, wrong-template, missing-token, and off-origin cases.
### Atomic email-verification issuance and delivery-failure cleanup

- `issueEmailVerificationToken` invalidates earlier outstanding links and inserts the new token digest in one D1 batch transaction. It issues only when the exact current email snapshot still belongs to the account and `email_verified_at` is null.
- Token lifetime is constrained to a normalized UTC expiry within one hour. The caller supplies only a digest; raw bearer tokens must never be stored.
- `invalidateEmailVerificationToken` revokes only the exact unconsumed token digest. If delivery of a newly issued token fails, cleanup cannot accidentally invalidate a newer request's token.
- Issuance and cleanup have separate regression tests, including account/mailbox binding, replacing previous active tokens, no insert for mismatched or already-verified accounts, and stale delivery-failure cleanup.
- These are storage primitives only. No request route is enabled, and no provider binding is configured. Route activation remains blocked until a real delivery service is configured and tested.
### Email-verification request orchestration

- `requestEmailVerification` coordinates token creation, digest-only persistence, and the provider-independent security-mail binding.
- It fails closed before token issuance when the `SECURITY_EMAIL` binding or canonical HTTPS origin is missing. Therefore an unavailable provider cannot invalidate a previously issued usable link.
- The bearer token is included only in the exact same-origin `/verify-email` URL fragment sent to the delivery binding. It is never returned to the caller or written to logs.
- New links expire after 30 minutes. If delivery fails, the helper attempts to invalidate only that exact token digest.
- Tests cover no-provider behavior, invalid origins, verified accounts, failed issuance, successful delivery, token privacy, and delivery-failure cleanup.
- This is an orchestration helper, not an active HTTP endpoint. No route is exposed, no `SECURITY_EMAIL` service binding is configured, and no real email provider has been connected or tested.
