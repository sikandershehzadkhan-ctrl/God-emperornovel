# Imperial Novel: P0 Owner Authority Implementation Record

**Phase:** 01N P0 security implementation
**Status:** Implemented on isolated integration branch; CI verification pending
**Production status:** Not deployed

## Change

- Introduced `isPlatformOwner(u, env)` using the Worker environment binding `IMPERIAL_OWNER_USER_ID`.
- Administrator elevation through `PATCH /api/admin/users/:id` now fails closed when the owner identity is not configured.
- When configured, only the matching owner account may grant the `admin` role.
- Non-owner administrators cannot alter another administrator account.
- The configured owner account cannot be demoted or banned through this endpoint.
- Role changes now check affected-row count and create an audit event.
- Added `scripts/test-owner-authority.mjs` to the application build regression chain.

## Required deployment configuration before this can operate

`IMPERIAL_OWNER_USER_ID` must be set to the numeric user ID of the sole platform owner in the Cloudflare Worker environment. The value has not been guessed or configured by this change. Until it is correctly configured, administrator elevation returns HTTP 503 and no account can be newly promoted to administrator through this route.

Before configuration, the owner account ID must be verified against the actual account record using a controlled, read-only process. Do not use a username/email guess, and do not place credentials or personal data in repository files.

## Scope and remaining risks

- This change closes the identified generic-admin privilege escalation path in this endpoint; it is not a complete owner RBAC/ABAC system.
- Other admin endpoints still use the generic `admin()` guard and need a permission-by-permission review.
- The admin user listing still requires field minimization and owner-only handling of sensitive account data.
- Owner identity configuration, account recovery, step-up authentication, session revocation and audit-log tamper resistance remain follow-up work.
- The test is a source-level regression assertion. It does not yet prove behavior with a real Worker request and D1 database.

## Verification gate

- Build regression test must pass.
- Wrangler dry-run and production safety checks must pass.
- Add isolated Worker+D1 request tests for non-owner admin promotion denial, owner promotion success, missing owner configuration, owner self-demotion/ban denial, and attempted modification of another admin.
- Do not merge or deploy until the actual owner ID is independently verified and the environment binding can be configured without lockout.