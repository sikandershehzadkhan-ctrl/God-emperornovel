# Imperial Novel: Domain Dependency, Event and Failure-Isolation Map

**Programme:** Phase 01N architecture
**Status:** Proposed runtime architecture; not implemented or load-tested
**Branch:** `architecture/phase-01n-master-route-registry`

## 1. Objective

Define how Imperial Novel domains depend on one another, which work must happen synchronously, which work belongs in queues, how events are made reliable, and how failures are contained. Reading and core account safety must not collapse because optional AI, analytics, recommendation or external-provider services are unavailable.

## 2. Architecture principles

- Keep the request path short, stateless and bounded.
- Treat D1 or the selected transactional database as the authoritative source for committed platform state.
- Use object storage for media and large assets; keep access private until publication and authorization allow delivery.
- Use queues for work that can complete after the user-facing transaction.
- Commit source state and an outbox event atomically where the storage design supports it; otherwise use a documented reconciliation mechanism.
- Consumers must be idempotent, retry safely, back off, and send poison messages to a dead-letter path.
- Never report a write as successful until its authoritative transaction has committed.
- External integrations and AI are optional dependencies, not prerequisites for reading published content.
- A dependency failure must have a defined timeout, fallback, alert and recovery procedure.
- Avoid introducing microservices or persistent real-time connections without measured need.

## 3. Domain dependency map

| Domain | Depends on | Provides to | Criticality |
|---|---|---|---|
| Identity and sessions | Database, cryptographic/session configuration | All protected domains | Critical |
| Authorization and policy | Identity, ownership records, policy version | Every protected read/write | Critical |
| Publication catalog | Identity/creator ownership, rights and moderation state | Home, catalog, novel detail, search, reader | Critical for public content |
| Chapter delivery and reader | Publication catalog, rights state, object/content storage, cache | Reader UI, reading progress | Critical |
| Reader activity | Identity, catalog identifiers | Library, history, personalization | Important; isolate writes |
| Creator Studio | Identity, authorization, creator workspace, catalog | Drafts, chapters, publication workflow | Important |
| Community | Identity, catalog references, moderation policy | Comments, reactions, reports | Important but degradable |
| Payments and ticket ledger | Identity, package catalog, payment provider callbacks | Reader entitlements and owner finance view | Financially critical; isolate provider |
| Search and discovery | Public catalog projections, taxonomy | Catalog and discovery pages | Degradable |
| Recommendations and rankings | Eligible catalog, minimized activity aggregates | For You, trending, rankings | Degradable |
| Analytics and real-time aggregates | Event ingestion and queues | Public counters, creator analytics, owner dashboard | Degradable |
| Notifications | Event queue, recipient preferences | User notification inbox | Degradable |
| OmniPortal and Trend Factory | Provider registry, rights policy, review workflow | Metadata candidates and approved links | Optional; disabled until approved |
| AI services | Explicit user request, authorized context, real backend/provider | Optional creator assistance | Optional; never blocks core reading |
| Admin and governance | Owner authentication, policy, audit and monitoring | Platform controls | Critical control plane |

## 4. Synchronous request paths

### 4.1 Public chapter read

1. Resolve route and canonical novel/chapter identity.
2. Check publication state, rights state, locale/version and access rules.
3. Serve an eligible public chapter from a correctly keyed cache where available.
4. On cache miss, read the authoritative published version and populate cache under a content-version key.
5. Emit a minimal view/engagement event asynchronously; do not block the chapter response on analytics.

Reading must not synchronously call recommendation, AI, external metadata providers, creator analytics, or payment reconciliation unless the specific chapter has a genuine entitlement requirement.

### 4.2 Authenticated reader action

1. Authenticate session and account state.
2. Resolve resource and authoritative owner.
3. Enforce object-level authorization and validation.
4. Commit the source write transaction, including idempotency where appropriate.
5. Return success only after commit.
6. Publish downstream work through an outbox/queue or reconciled event path.

### 4.3 Publication transition

1. Verify author/workspace permission and publication rights evidence.
2. Validate novel/chapter metadata and required assets.
3. Apply moderation/editorial gates and state transition.
4. Commit publication version and state atomically.
5. Emit publication event.
6. Asynchronously invalidate/rebuild search documents, rankings, recommendations, catalog caches and notifications.
7. If downstream consumers fail, preserve the committed publication state and retry derived work; expose a clear operational warning rather than silently reverting or pretending every projection is current.

### 4.4 Payment confirmation

1. Receive provider callback over a bounded endpoint.
2. Verify provider signature and event authenticity.
3. Deduplicate by provider event ID and idempotency key.
4. Reconcile against the expected payment intent, user, amount, currency and package.
5. Commit payment state and ledger credit exactly once.
6. Acknowledge only after durable commit; otherwise return a retryable failure.
7. Reconcile pending/uncertain states with provider status. Never grant twice because of callback retries.

## 5. Event contract

Every event envelope should include a versioned schema and only the fields required by consumers:

```json
{
  "event_id": "opaque-unique-id",
  "event_type": "catalog.chapter.published",
  "schema_version": 1,
  "occurred_at": "RFC3339 timestamp",
  "producer": "publication-domain",
  "aggregate_type": "chapter",
  "aggregate_id": "internal-id",
  "aggregate_version": 7,
  "correlation_id": "request-correlation-id",
  "actor_type": "user",
  "actor_id": "internal-actor-id",
  "payload": {
    "novel_id": "internal-novel-id",
    "locale": "en",
    "publication_version": 7
  }
}
```

Illustrative schema only. Never place passwords, session tokens, recovery codes, payment secrets, private chapter text, full user profiles, or unnecessary personal data in event payloads.

Event requirements:

- Stable event ID and schema version.
- Aggregate ID and monotonic aggregate version where ordering matters.
- Correlation ID for tracing the originating request.
- Idempotent consumer-side deduplication.
- Explicit retry classification and maximum delivery age.
- No assumption of exactly-once delivery; design for at-least-once delivery.
- Dead-letter handling with restricted access and replay controls.
- Schema compatibility policy and consumer contract tests.

## 6. Proposed event catalogue

| Event | Producer | Consumers | Required behavior |
|---|---|---|---|
| `account.created` | Identity | Welcome notification, minimal analytics | Do not expose email or credential data |
| `account.security_changed` | Identity | Security alert, audit | High priority; restricted payload |
| `catalog.novel.published` | Publication | Search, cache, sitemap, rankings, notification | Version-aware rebuild/invalidation |
| `catalog.novel.unpublished` | Publication/governance | Search removal, cache purge, sitemap, recommendations | Urgent suppression; stale public content must not remain served |
| `catalog.chapter.published` | Publication | Chapter cache, search metadata, sitemap, followers | Publish only rights-cleared version |
| `catalog.chapter.corrected` | Publication | Cache/index refresh, correction notice if needed | Versioned invalidation |
| `reader.chapter.viewed` | Reader edge/request path | Analytics aggregation | Deduplicate and aggregate asynchronously |
| `reader.position.updated` | Reader activity | Cross-device sync, aggregate progress if enabled | Last-write/version policy; private event |
| `community.comment.created` | Community | Moderation triage, notification, aggregate counters | Apply spam/rate controls; do not expose report evidence |
| `community.report.created` | Trust and safety | Moderation case queue | High privacy; preserve reporter confidentiality |
| `payment.intent.updated` | Payments | Ledger reconciliation, notification, owner finance view | Idempotent state machine |
| `payment.ledger.credited` | Ledger | Entitlement projection, receipt notification | Exactly-once effect through idempotent ledger transaction |
| `provider.import.candidate.created` | Import workflow | Duplicate detection, review queue | Metadata/provenance only by default |
| `analytics.aggregate.updated` | Analytics | Dashboards and public aggregate projections | No raw personal data in public projection |

## 7. Queue classes and operational policy

| Queue class | Examples | Priority | Failure policy |
|---|---|---|---|
| Security/financial | Security alerts, payment reconciliation | Highest | Durable retries, strict idempotency, alert on age/depth, manual reconciliation |
| Publication integrity | Cache invalidation, search suppression, rights/takedown propagation | High | Retry promptly; fail closed on serving if rights/publication state uncertain |
| User experience | Notifications, reading sync, comment triage | Normal | Retry with backoff; preserve source transaction |
| Analytics | Views, engagement, aggregates | Low/normal | Batch, deduplicate, tolerate delayed aggregates; never block reading |
| Optional integrations | Metadata ingestion, AI tasks, provider health | Low | Circuit breaker, quotas, pause/kill switch; no effect on core reader |

Queue design must set message size limits, visibility timeout, retry count, exponential backoff with jitter, maximum age, dead-letter retention, replay authorization and poison-message alerting. Do not put large chapter bodies or media files into queue messages.

## 8. Cache and consistency boundaries

Public cache candidates: published catalog pages, public novel metadata, rights-cleared published chapter versions, public taxonomy and stable static assets.

Never place the following in shared public cache: account pages, sessions, library, history, bookmarks, reading position, private notifications, drafts, author analytics, payment data, moderation cases, reports, personalized recommendations, or any response whose contents depend on user authorization.

Cache key dimensions must include every content-affecting dimension, such as resource ID, publication version, locale, representation and relevant rights/access policy version. Never use a user ID supplied by the client as the only isolation boundary.

Use versioned immutable content keys where possible. On unpublish, rights withdrawal, suspension or takedown, serving must re-check the authoritative eligibility state or use a revocation mechanism with a bounded stale window appropriate to the risk. A cache purge event alone is not a sufficient rights-control mechanism.

Define consistency expectations:

- Payment ledger and entitlements: strongly consistent transaction semantics.
- Ownership and authorization: authoritative current state; stale grants must not authorize access.
- Published chapter body: versioned content; short bounded propagation for corrections, immediate suppression path for rights/takedown.
- Search and rankings: eventual consistency with visible freshness monitoring.
- View counters and analytics: eventual consistency; never invent or fabricate counts.
- Notifications: eventual delivery, deduplicated where practical.

## 9. Failure-isolation and fallback matrix

| Failure | User-visible behavior | System response | Must not happen |
|---|---|---|---|
| Analytics queue unavailable | Reading continues; counters may update later | Buffer/retry within bounded limits; alert on loss risk | Block chapter delivery |
| Recommendation service unavailable | Show popular, recent or editorially selected fallback | Circuit breaker; cache fallback; monitor recovery | Blank the whole homepage or block catalog |
| Search index unavailable | Show cached/popular catalog and explain limited search if needed | Retry index rebuild; retain source catalog | Lose source novel/chapter records |
| Notification provider unavailable | In-app state remains; delivery delayed | Queue and retry; honor preferences | Fail account or publication transaction |
| AI provider unavailable | Explain AI feature temporarily unavailable | Timeout, circuit breaker, quota and fallback to manual editing | Block author drafts or reading |
| OmniPortal/provider unavailable | Show disconnected/unavailable state | Pause provider jobs; retry safely | Ingest unapproved content or leak credentials |
| D1/database unavailable | Do not claim writes succeeded; show retry-safe error | Alert, protect consistency, recover from backup if needed | Fabricate successful payment, bookmark or publication |
| Object storage unavailable | Show safe asset fallback; core text may continue if separately available | Retry media operations; serve only valid cached assets | Expose private object keys or assume upload succeeded |
| Queue consumer failing | Source transaction remains committed; derived view may be delayed | Retry, dead-letter, alert and replay after fix | Drop silently or duplicate financial side effects |
| Payment provider uncertain | Mark payment pending/verification required | Reconcile provider status and ledger | Double-credit or tell user payment is confirmed prematurely |
| Authorization state unavailable | Protected operation denied temporarily | Fail closed and alert | Fall back to public or permissive access |

## 10. Real-time information architecture

Real-time counters must be based on measured events with deduplication and transparent definitions. Distinguish:

- raw request/page loads
- unique or estimated readers, with a documented time window and privacy-safe identity method
- chapter opens
- engaged reading events, if a defensible definition exists
- comments, reactions and ratings as committed records
- delayed aggregate freshness

Do not label a cached aggregate as live if it is stale. Show a last-updated time or freshness state where meaningful. Avoid a permanent socket for every passive reader. Prefer event aggregation, short polling or server-sent updates only for screens that materially benefit and only after scale/security testing.

## 11. Observability and alerting

Every request and event should carry a correlation ID. Capture structured metrics without sensitive payloads:

- request latency p50/p95/p99, throughput and error rate
- Worker runtime duration, CPU/subrequest limits and exceptions
- database latency, query count, slow queries, contention and write failures
- cache hit/miss, stale serving, purge lag and key cardinality
- queue depth, oldest-message age, retry count, dead-letter count and consumer duration
- payment pending age, callback verification failures, duplicate events and reconciliation mismatches
- publication/index/cache propagation delay
- authorization denials, suspicious enumeration and rate-limit triggers
- provider/AI error rate, timeout rate, circuit state and spend/usage where available

Alert on user-impacting thresholds and sustained trends. Define thresholds from measured baseline, not invented assumptions. Logs must redact tokens, secrets, private content and unnecessary personal data.

## 12. Recovery and operational controls

- Feature flags for optional subsystems and risky releases.
- Kill switches for each external provider, AI workflow, import source and real-time feature.
- Retry with bounded exponential backoff and jitter; prevent synchronized retry storms.
- Dead-letter queue inspection and replay restricted to authorized owner operations.
- Idempotency keys for payment, publication and other non-repeatable side effects.
- Database backup schedule, retention, integrity checks and restore drills.
- Documented recovery point objective (RPO) and recovery time objective (RTO), chosen after provider and budget constraints are known.
- Deployment rollback and schema compatibility strategy.
- Incident playbooks for data exposure, credential compromise, payment mismatch, rights takedown, data corruption and provider outage.

## 13. Capacity and graceful degradation assumptions

Design for a scenario where 1,000 readers request the same published chapter, but do not claim the current platform can serve that load. The target design is:

1. Edge cache serves the same eligible versioned chapter body to many readers.
2. Per-user reading position/bookmark state remains separate and private.
3. View events are aggregated asynchronously rather than writing one expensive analytics row synchronously for every render.
4. Recommendations, creator analytics, notifications and AI do not run in the chapter request path.
5. Cache miss and database load are bounded by query budgets and tested concurrency limits.
6. If the database or cache degrades, the system has an explicit safe fallback and does not misreport writes.

Validate with staged concurrency and spike tests, including cold cache, mixed catalog/search, anonymous and authenticated reads, writes, slow database, queue outage, provider timeout and mobile networks. Record p50/p95/p99, throughput, errors, cache hit rate, database load and cost per 1,000 requests.

## 14. Implementation sequence

1. Inventory current Worker handlers, database writes, external calls and scheduled jobs.
2. Mark each request-path dependency as critical, optional or derived.
3. Define event schemas and consumer contracts for only the first required events.
4. Implement idempotency and outbox/reconciliation for high-value state changes.
5. Add queue retries, dead-letter handling, metrics and alerts.
6. Move analytics and noncritical side effects out of synchronous reader paths.
7. Add versioned cache keys and private-response cache protections.
8. Add circuit breakers and kill switches for optional providers/AI.
9. Test outage scenarios and replay behavior before enabling production traffic.
10. Measure and tune under staged load; document verified limits.

## 15. Completion gates

- [ ] Current source dependency graph and synchronous external calls are inventoried.
- [ ] Each event has a versioned schema, owner, producer, consumers and privacy review.
- [ ] Critical events are durable and idempotent; poison-message handling is tested.
- [ ] Publication and rights changes propagate to caches and indexes within an explicitly tested bound.
- [ ] Private data cannot cross cache boundaries.
- [ ] Analytics, AI, recommendations and optional providers cannot block core reading.
- [ ] Payment retries and duplicate callbacks cannot double-credit.
- [ ] Database, queue, cache, object-storage and provider failure drills pass.
- [ ] Metrics and alerts exist for latency, errors, queue age, cache and data integrity.
- [ ] Backup restore, rollback and incident procedures are rehearsed.

**Current phase result:** Dependency and failure architecture drafted. Runtime queues, events, cache controls, observability, failure drills and capacity are not yet implemented or verified.

---

**Next architecture dependency:** create a measurable load/capacity test plan, then complete source-level API and dispatcher reconciliation before any implementation changes.