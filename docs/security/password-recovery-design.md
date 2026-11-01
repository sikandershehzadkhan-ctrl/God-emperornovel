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
- These primitives do not create live reset requests, send email, expose a reset endpoint, or enable password recovery. The raw token must be delivered only through a verified provider channel; only the digest is intended for persistence.
- CI must pass before this primitive is treated as validated.

## Implementation sequence

1. Choose and configure a transactional email provider and verified sender domain.
2. Add the reset-token D1 migration and cryptographic token helper.
3. Add request and completion endpoints with generic responses and rate limits.
4. Add two-account local Worker + D1 tests, including concurrency and failure cases.
5. Run the full Cloudflare validation workflow.
6. Keep the feature disabled until provider delivery and the full test suite pass.

Password recovery is not considered complete until all six steps pass. No production secret, email, or deployment change is made by this design.
