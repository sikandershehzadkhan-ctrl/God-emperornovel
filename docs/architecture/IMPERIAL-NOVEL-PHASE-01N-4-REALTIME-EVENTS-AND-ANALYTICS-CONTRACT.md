# Imperial Novel | Phase 01N.4: Real-Time Events & Analytics Contract

**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Target architecture based on static code evidence; not a deployed real-time capability claim.

## 1. Current observed behavior

The audited branch provides request-time D1 reads for platform overview, chapter/novel engagement, catalog and account surfaces. The client notification page refreshes its list on a 30-second interval while visible. Worker cron triggers are configured for every 15 minutes, hourly and daily at 03:00, and scheduled automation runs selected agents.

No WebSocket, Durable Object broadcast, Server-Sent Events or other persistent push transport was established in this source inspection.

Therefore:
- D1 request-time read means fresh-at-request, subject to the query and cache path.
- 30-second notification polling means a best-effort refresh interval, not instant delivery.
- Cron automation is scheduled processing, not user-facing live presence.
- A count displayed in a card is not real-time unless its data source and refresh behavior are explicit.
- No online-user count or live reading presence should be claimed without a privacy-reviewed presence system.

## 2. Event architecture

Use durable domain events as the source of truth. UI notifications, analytics, agents and external integrations are consumers, not authoritative state.

Every event envelope includes:
- `event_id`: globally unique immutable identifier;
- `event_type` and `schema_version`;
- `aggregate_type`, `aggregate_id`, and monotonic aggregate version where available;
- `occurred_at` (UTC);
- `recorded_at` (UTC);
- `actor_type` and minimally necessary actor reference;
- `correlation_id` and `causation_id`;
- `visibility_class` and data classification;
- minimal payload with no credentials or unnecessary personal data.

Event consumers must be idempotent and tolerate duplicates, delayed delivery and out-of-order arrival. Event payloads must not become a second mutable copy of the business record.

## 3. Event families

### Identity and security
- account registered, verified, password changed, session revoked, deletion requested;
- suspicious authentication signal, alert opened, incident status changed.

### Reading and library
- chapter opened, reading position updated, chapter completion recorded, bookmark changed, collection changed.

Do not equate chapter open with chapter read or completion. Reading telemetry must be privacy-minimized and disclosed.

### Community
- review created/updated, comment created/edited/hidden, reaction changed, follow created/removed, report submitted, moderation decision recorded.

### Creator and publishing
- application submitted/decided, work draft saved, chapter submitted, review requested, publication approved/rejected/published, scheduled publication fired.

### Commerce
- order created, payment attempt received, payment verified/rejected, Crown ledger entry posted, unlock granted, refund/adjustment posted.

A payment provider callback is an untrusted input until signature, event identity, amount, currency, merchant account and replay window are verified.

### OmniPortal and Trend Factory
- provider authorization requested/approved/revoked, health check completed, search observation captured, import requested/reviewed/completed;
- source observation captured, duplicate resolved, trend derived, editorial review decided, report published.

## 4. Transport tiers

### Tier 1: Request-time reads
Use for catalog, detail, account balance/ledger, publishing status and other state where a page request can query D1 directly.

UI must display an “as of” timestamp when freshness matters. Do not show a live badge merely because the page fetched data.

### Tier 2: Polling
Use for notifications, job status and low-frequency dashboards where push infrastructure is not justified.

Contract:
- poll only while the relevant page is visible;
- back off on errors and after repeated failures;
- use conditional/version cursors to fetch changes only;
- pause or reduce polling in background tabs and on low-power devices;
- expose last successful refresh and stale state;
- avoid synchronized polling spikes with jitter;
- do not poll every 1–2 seconds for ordinary dashboard counts.

The current notifications page uses a 30-second refresh interval. This is the observed baseline, not a guarantee of delivery latency.

### Tier 3: Push transport (future)
A Durable Object/WebSocket or Server-Sent Events channel may be considered for high-value interactive experiences after scale, privacy, cost and reconnection needs are measured.

Push messages contain a minimal event reference/version, not private content. The client then fetches the authorized resource from the API. Push delivery is an optimization; D1 remains authoritative.

## 5. Freshness vocabulary

Use consistent visible labels:
- **Just updated:** source timestamp within a short, defined threshold for this data type.
- **Updated N min ago:** exact elapsed time from recorded source timestamp.
- **Scheduled update:** source refresh is periodic; show last successful run and expected cadence.
- **Stale:** exceeds the documented freshness threshold.
- **Delayed:** known processing queue or provider delay.
- **Unavailable:** no successful source result; do not substitute stale data as current.
- **Not measured:** instrumentation does not exist or coverage is insufficient.

Thresholds must be configured by data class, not one global “live” label. Example starting policies:
- user reading position: save after deliberate progress update; conflict/version aware;
- notification inbox: 30-second poll baseline, visible stale indicator after failed refresh;
- provider health: show exact last check and result; scheduled check is not proof of provider uptime between checks;
- trend observations: show collection time, measurement window and source freshness;
- financial balance: read authoritative ledger/balance on request, never use a stale client cache to authorize spending.

## 6. Analytics definitions

Every metric has a stable metric ID, definition, event source, aggregation, time zone, window, deduplication rule, exclusions, retention and instrumentation coverage.

Required distinctions:
- page request vs unique visitor;
- novel detail request vs engaged reader;
- chapter open vs chapter completion;
- registered account vs active reader;
- total views vs unique readers;
- rating average vs rating count;
- reaction count vs distinct reacting accounts;
- payment attempt vs verified payment;
- gross ticket/Crown spend vs author earnings;
- ledger credit vs available balance;
- provider registry entry vs enabled authorized provider;
- scheduled job vs successful completed job.

If unique identity is unavailable or privacy rules prohibit it, report request counts, not inferred unique users. Do not extrapolate missing data without an explicit estimate label and methodology.

## 7. Metric integrity and anti-abuse

- Deduplicate event ingestion by event ID.
- Use server-generated timestamps for authoritative financial/security events.
- Rate-limit engagement writes and apply per-account uniqueness constraints where appropriate.
- Detect obvious bot/request spikes without silently deleting valid readers.
- Keep raw event retention proportionate and privacy reviewed.
- Backfills carry a backfill marker and do not masquerade as events that occurred live.
- Corrections use compensating records or versioned recomputation, not silent historical mutation.
- Keep event schemas versioned and validate producer/consumer compatibility.

## 8. D1 and Worker design constraints

Cloudflare Worker + D1 is the current platform baseline. Keep the first implementation simple:
- write authoritative business state and outbox event in the same D1 transaction/batch where possible;
- process outbox records in bounded scheduled batches;
- persist retry count, next-attempt time and terminal failure state;
- use unique consumer/event keys to prevent duplicate side effects;
- keep payloads small and indexed by status/created time;
- define cleanup/retention jobs and dead-letter review;
- avoid unbounded scans and N+1 polling;
- do not introduce Durable Objects solely to decorate dashboard counters.

Before adopting push, measure polling request volume, D1 query load, user concurrency and the required latency of each experience.

## 9. Real-time product surfaces

| Surface | Target mechanism | Truthful UI |
|---|---|---|
| Reader progress | Request-time write/read + conflict-aware sync | Saved / saving / offline / conflict |
| Notifications | 30-second polling baseline; push optional later | Last refreshed / delayed |
| Author job status | Poll durable job ID; push optional | Queued / running / succeeded / failed |
| Publishing review | Request-time + notification | Persisted decision timestamp |
| Crown balance | Authoritative request-time ledger/balance | Updated at; pending transactions separate |
| Provider health | Scheduled check + request-time read | Last checked, measured status |
| Trend Factory | Scheduled observations + request-time report | Collection time and observation window |
| Admin overview | Request-time aggregates with bounded refresh | Data window and last refresh |
| Presence/online users | Not implemented/verified | Do not show live presence claims |

## 10. Acceptance tests

1. A duplicate event does not duplicate a ledger credit or notification side effect.
2. Out-of-order reading events cannot move a user's position backward without conflict handling.
3. Polling pauses/reduces when page is hidden and backs off on failures.
4. UI reports the timestamp of last successful refresh.
5. A failed poll cannot replace valid data with fabricated zeros.
6. A stale provider check is labeled stale, not online.
7. A queued agent job is not displayed as completed.
8. Chapter open is not counted as completed reading.
9. Unique readers are not inferred from raw request counts.
10. Financial values are read from authoritative ledger state.
11. Payment callbacks are verified and replay-protected before financial events are emitted.
12. Every event consumer is idempotent under retries.
13. Event payloads exclude credentials and unnecessary private user data.
14. Scheduled processing exposes queue age, last success and failure count.
15. No public surface exposes private reading or presence data.

## 11. Completion boundary

This document specifies a truthful real-time and analytics contract. It does not add push infrastructure, Durable Objects, event tables, outbox processing, new analytics instrumentation or a live-presence feature. No code, D1 schema, production data or deployment was changed.
