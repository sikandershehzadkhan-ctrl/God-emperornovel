# ADR-0006: Isolated local D1 integration tests for account and reader ownership

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Identity, reader and platform-quality domains

## Context

Static policy and source assertions cannot prove that the deployed Worker dispatcher, session lookup and D1 predicates isolate two real accounts. Profile, preference and reading-progress APIs share one Worker and must be tested together against a real D1-compatible runtime without touching production data.

## Decision

1. Run the Worker through Wrangler's local runtime with a fresh temporary D1 persistence directory for each test execution.
2. Apply the repository's canonical migrations to that local database only.
3. Create two independent test accounts through the public registration and login endpoints; never seed session tokens or password hashes directly.
4. Seed only the minimum published novel/chapter fixtures needed to exercise reading-progress authorization.
5. Verify profile and preference owner isolation, public-profile visibility and opt-in statistics, reading-progress owner isolation, optimistic revision conflicts, cross-origin rejection, rights eligibility and logout revocation.
6. Keep the integration test in the mandatory build so the Cloudflare source-validation workflow executes it on every governed integration PR.
7. Terminate the local Worker and delete the temporary D1 directory in a \`finally\` block, including failure paths.

## Safety boundaries

- The test uses \`--local\` D1 and a unique temporary persistence directory.
- It must never use \`--remote\`, production database credentials or Cloudflare API tokens.
- Test accounts and fixture content exist only in the temporary local database.
- The test does not deploy the Worker or mutate production D1.

## Consequences

- Two-account D1 behavior is tested against the actual Worker dispatcher rather than only source-text assertions.
- Browser automation, offline recovery, account switching and cross-device preference synchronization remain separate staging acceptance checks.
- The test increases CI build time because Wrangler starts a local Worker and D1 runtime.

## Rollback

Remove the mandatory build invocation and test harness together if Wrangler's local runtime becomes unavailable. Existing static regression checks remain in place; production deployment stays blocked until equivalent isolated runtime coverage is restored.
