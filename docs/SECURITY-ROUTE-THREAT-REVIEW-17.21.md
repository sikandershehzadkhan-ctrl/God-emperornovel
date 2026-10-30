# Imperial Novel Security Review: Route-Level Threat Findings

**Date:** 2026-10-31  
**Baseline:** `main`, source SHA `4d727121f226f549d22af7c1b1a257ac7e2cb013`, version 17.20.0  
**Review type:** Static source review. No production data was changed. No exploit attempt or authenticated production test was performed.

## Executive summary

A deeper pass through the Worker dispatcher identified concrete financial-integrity and resource-abuse risks that should be resolved before payments or federated connector search are enabled broadly. This report supplements `PLATFORM-RESEARCH-AND-GAP-ANALYSIS-17.21.md`.

Severity is provisional and reflects potential impact, not confirmed exploitation.

## Confirmed source-level findings

### F-01: Payment webhook credit is not bound to a verified purchase amount or provider event identity
**Provisional severity: Critical / release blocker**

The `POST /api/payment/webhook` handler:
1. Checks whether `PAYMENT_WEBHOOK_SECRET` exists.
2. Computes an HMAC over the raw body and compares the supplied `x-payment-signature`.
3. Finds a pending donation by `reference_id`.
4. Batches an approval update, ticket credit using `Number(b.tickets || 0)`, and ledger insertion.

The inspected handler does not show:
- Provider event ID persistence/deduplication.
- A server-side mapping from the donation's recorded amount/currency to an allowed ticket pack.
- A positive integer/range check for ticket quantity.
- A conditional pending-to-approved update whose affected-row count gates the ledger credit.
- A verified relationship between the provider's captured amount/currency and the donation row.
- A refund/reversal event lifecycle.

A valid signed payload could therefore request a ticket quantity not independently derived from the recorded payment. Duplicate or concurrent event handling also needs a database-enforced idempotency invariant. The existing batch alone is not proof that the approval condition is checked atomically.

**Required fix:** persist provider event IDs with a UNIQUE constraint; validate provider-specific signature scheme and timestamp/replay window; load the pending donation; compare amount, currency, merchant/account and reference against provider-verified transaction data; map only approved fixed ticket packs server-side; use one conditional state transition and only credit when exactly one pending row changes; write one immutable ledger entry with a unique reference; implement refund/reversal accounting; test duplicate delivery, concurrent delivery, malformed JSON, wrong amount, wrong currency, negative/fractional/oversized tickets and unknown references.

**Current safe state:** payment automation remains disabled unless a secret is configured. Keep it disabled until provider integration and tests are complete.

### F-02: Manual donation approval has a read-then-write race and client-selected credit quantity
**Provisional severity: High / financial release blocker**

The `PATCH /api/admin/donations/:id` handler reads a donation, checks `status === 'pending'`, then batches status update, user balance increment and ledger insertion. The request body can provide `tickets`, with the donation amount used as a fallback. The source does not show an atomic conditional update gating the credit, a unique ledger reference, or a server-side fixed price-pack mapping.

**Required fix:** use the same idempotent financial state-transition service as the webhook. The admin should approve a verified payment record, not choose arbitrary ticket quantity. Use a conditional UPDATE and inspect affected rows, immutable ledger uniqueness, and explicit rejection/refund states. Require a reason and audit before/after values.

### F-03: Admin ticket adjustment accepts unbounded signed amounts
**Provisional severity: High**

The `POST /api/admin/tickets` handler converts `b.amount` to Number and rejects only falsy values. It does not visibly enforce integer, positive-only, maximum amount, target-user existence or an explicit credit-versus-debit action. A negative amount can reduce an account balance through this administrative route.

**Required fix:** replace the ambiguous signed amount with an explicit action enum (grant/reversal/adjustment), bounded positive integer quantity, required reason, target validation, immutable audit event and transactional balance/ledger invariant. If debit is needed, use a separately authorized conditional debit operation. Test zero, negative, fractional, huge, non-numeric and nonexistent-user inputs.

### F-04: Novel-request ticket debit is based on a previously read balance
**Provisional severity: High**

The `POST /api/requests` handler reads the user's current ticket balance from the session lookup, calculates a cost, and batches request insertion, balance decrement and ledger insertion. The balance check is performed before the batch; the update shown does not include a `tickets >= cost` predicate. Concurrent requests can therefore race against the same observed balance unless another database invariant prevents it.

**Required fix:** use a conditional atomic debit (`UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=?`), inspect affected rows, insert request and unique ledger entry in the same transaction/batch, and roll back all effects if the debit fails. Add simultaneous-request tests and weekly free-quota uniqueness/transaction tests.

### F-05: Federated connector search is reachable without authentication or visible rate limiting
**Provisional severity: High / resource-abuse risk**

The `GET /api/omni/search` branch is not guarded by `need(u)`. It queries enabled, rights-authorized connectors and invokes `omniConnectorSearch` for each connector. The helper makes outbound fetches with a seven-second timeout and does not show a per-IP, per-account or global concurrency/rate limit in this path.

This means anonymous requests can trigger multiple third-party requests for arbitrary search terms. Even if each connector is intentionally authorized, an attacker could consume provider quotas, Worker subrequests and CPU/network budget.

**Required fix:** keep local catalogue search public, but protect federated connector fan-out with a strict rate limit, bounded connector count, bounded concurrent requests, query length/character validation, short cache, global circuit breaker and per-connector health budget. Consider requiring a signed-in account for federated results. Add abuse tests and ensure no secret-bearing connector response data is returned.

### F-06: Connector search URL is an administrator-controlled outbound request target
**Provisional severity: High / needs SSRF-focused review**

The connector search helper interpolates a configured `search_url` and calls `fetch(target)`. The admin connector PATCH path stores `search_url` as supplied. The helper shown does not call the existing `allowedHost` helper before fetching. The admin interface is privileged, but a compromised or malicious administrator configuration could turn the Worker into an outbound request proxy. Whether a specific private or metadata address is reachable from Cloudflare Workers must be dynamically tested; this report does not claim that it is.

**Required fix:** validate URLs at configuration time and again at execution; HTTPS only; exact host allowlist, not suffix confusion; forbid credentials, fragments and unexpected ports; resolve and reject private, loopback, link-local, reserved and metadata IP ranges where the runtime permits; disable redirects or revalidate every redirect; enforce response size, content type, timeout, and safe JSON parsing; never allow arbitrary header names or environment binding names from untrusted connector records. Use a connector-specific secret binding map rather than arbitrary `env[secret_name]`.

### F-07: Runtime request path performs schema DDL/readiness work
**Provisional severity: Medium / reliability and latency risk**

The API entry invokes `ensureCoreSchema`, `ensureAuthRateLimitSchema`, `ensureCommunityV2` and `ensureDiscoverySchema` before route dispatch. Other paths call `ensureOmniTables`, whose helper attempts `ALTER TABLE` statements and creates tables/indexes, and `seedOmni` invokes that helper. Some helpers cache readiness per Worker isolate; isolate-local caching is not durable across isolate restarts and is not a substitute for a migration lifecycle.

**Required fix:** move all DDL and data backfills into versioned migrations; remove schema mutation from GET and request handling; deploy only after migration preflight and verified backup; keep runtime handlers fail-closed when required schema is absent. Test fresh DB, supported upgrade DB, partially applied migration, rollback and concurrent cold starts.

### F-08: GET endpoints can trigger stateful initialization
**Provisional severity: Medium**

The `GET /api/omni/status` path invokes `seedOmni`, which ensures schema and inserts registry rows. The API dispatcher also performs readiness/schema helpers before handling health and other GET routes. Read operations should not be the mechanism that mutates schema or seeds core records.

**Required fix:** move seed data into migrations or explicit admin maintenance commands; GET must be side-effect-free apart from bounded read telemetry. Verify repeated and concurrent GETs do not alter business state.

## Security controls that remain unverified

These are not asserted vulnerabilities. They require a route-by-route and runtime review:
- CSRF/origin validation for every cookie-authenticated state-changing route.
- Session rotation, password change/reset, revocation and expiry behavior.
- Consistent per-route rate limits for comments, ratings, reports, requests, uploads, search, AI and admin operations.
- Stored XSS across chapters, comments, profile fields, imported metadata, image URLs and admin previews.
- Content Security Policy compatibility and removal of broad inline script/style allowances where feasible.
- Audit-log failure behavior, retention, tamper resistance and coverage of every high-impact admin action.
- Object ownership checks for every novel, chapter, AI project, report and user-specific resource.
- Connector redirects, DNS rebinding, IP ranges, response size and secret isolation.

## Test plan required before release

### Financial invariant tests
- Duplicate webhook event delivered sequentially and concurrently credits exactly once.
- Same provider event ID with changed payload is rejected.
- Correct signature but wrong amount/currency/reference does not credit.
- Negative, fractional, zero, non-numeric and excessive ticket values do not credit.
- Admin approval races resolve to exactly one terminal state and one ledger entry.
- Two concurrent chapter/request purchases cannot overspend.
- Refund/reversal never silently edits historical ledger entries.

### Connector abuse tests
- Anonymous federated search cannot fan out without configured policy.
- Per-IP/account rate limits return 429 with bounded retry.
- Connector URL with localhost, private IP, link-local, metadata IP, credentials, unexpected port, suffix-confusion hostname or redirect to a blocked host is rejected.
- Oversized, slow, malformed and non-JSON responses fail closed.
- Connector secrets never appear in logs or returned JSON.
- A failed provider is circuit-broken and does not stall the full search.

### Migration/reliability tests
- Fresh database applies all migrations cleanly.
- Production-shaped fixture upgrades from each supported schema marker.
- Partial migration stops deployment and does not advance schema marker.
- Verified export can be restored to an isolated D1-compatible SQLite fixture.
- Runtime GET requests do not execute DDL or seed rows.

## Release decision

- Do not enable payment automation.
- Do not enable unbounded federated connector fan-out.
- Do not merge high-risk financial changes until the D1 backup/restore rehearsal and transaction tests pass.
- Do not deploy this review as runtime code. This document is evidence and a remediation plan, not a fix.
