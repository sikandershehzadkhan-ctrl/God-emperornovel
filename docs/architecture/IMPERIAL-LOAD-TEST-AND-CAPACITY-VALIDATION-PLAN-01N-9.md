# Imperial Novel: Load Test and Capacity Validation Plan

**Programme:** Phase 01N architecture
**Status:** Test strategy and proposed acceptance gates; no load tests executed
**Branch:** `architecture/phase-01n-master-route-registry`

## 1. Purpose and truth standard

This plan defines how to measure real platform capacity before inviting readers at scale. Concurrency figures in this document are test scenarios, not current capacity claims, SLAs, or promises. No SLO or safe user limit is declared until repeatable measurements exist.

Testing must protect production data and payment integrity. Use a representative staging environment, synthetic accounts and content, isolated payment sandbox, and controlled traffic. Do not run destructive, stress, or spike tests against production without an explicitly approved maintenance window and rollback plan.

## 2. Capacity dimensions

Measure the whole user journey, not just raw requests per second:

- concurrent readers and active sessions
- requests per second and successful chapter deliveries
- cache hit ratio and cold-cache origin load
- Worker duration, CPU/subrequest limits, exceptions and throttling
- database read/write latency, query count, contention and failures
- queue depth, oldest event age, retries and dead letters
- object storage latency and media delivery failures
- search latency, result quality and index freshness
- authentication, session and authorization overhead
- mobile-network latency, timeouts and retry behavior
- cost and provider quotas per 1,000 requests and per active reader

Report p50, p95 and p99 latency, throughput, error rate, timeout rate, cache hit ratio, database utilization/latency, queue age, and cost. Segment anonymous and authenticated traffic and warm/cold cache results.

## 3. Workload model

Build a synthetic workload that represents realistic reading patterns rather than uniform repeated GET requests:

| Workload | Example behavior | Main pressure point |
|---|---|---|
| Chapter reading | Open chapter, spend think-time, navigate next/previous, resume position | Cache, Worker, database cache miss |
| Catalog browsing | Home, catalog filters, novel detail, chapter archive | Query/index, cache key cardinality |
| Search | Common and rare terms, pagination, filters | Search provider/index and database fallback |
| Reader activity | Bookmark, library add/remove, reading-position update | Auth, write contention and idempotency |
| Community | Read comments, post comments/reactions, report content | Moderation, rate limits and writes |
| Authentication | Login/session refresh/logout/recovery attempts | Credential verification, abuse limits |
| Creator workflow | Draft edit, chapter save, preview, submit/publish | Writes, validation, object storage and invalidation |
| Payments | Create intent, delayed callback, duplicate callback, reconcile | Idempotency, ledger integrity, provider dependency |
| Owner operations | Dashboard reads, audit searches, export simulations | Privileged query load and data minimization |

Use realistic think time, session reuse, varied content, request mix, and a controlled percentage of cache misses. Avoid an unrealistic single hot URL test as the only capacity measure.

## 4. Staged concurrency matrix

| Stage | Concurrent virtual users | Goal | Exit requirement |
|---|---:|---|---|
| A | 10 | Establish baseline and detect functional bottlenecks | No correctness failures; metrics captured |
| B | 50 | Validate ordinary early audience behavior | No material error growth; no data-integrity failures |
| C | 100 | Validate moderate concurrency and mixed workloads | Latency/error trends understood; DB and queue remain bounded |
| D | 500 | Identify scale bottlenecks and saturation points | No cross-user leakage or duplicate side effects; degradation controlled |
| E | 1,000 | Validate target scenario under defined cache and traffic mix | Explicit pass/fail report; no claim beyond tested conditions |

Each stage runs warm-cache and cold-cache variants, anonymous and authenticated variants, plus a mixed workload. Increase traffic gradually and stop on safety thresholds. Repeat key runs to detect variance.

## 5. Required scenarios

### 5.1 Shared chapter hot spot

- 1,000 virtual readers request one rights-cleared published chapter.
- Mix first load, refresh, next chapter, and periodic reading-position writes.
- Test warm cache, cold cache, cache expiry, and publication-version change.
- Confirm chapter body is served from eligible shared cache while private progress remains user-isolated.
- Measure origin request amplification, database reads, cache hit ratio, p95/p99, Worker limits and error rate.
- Confirm analytics processing does not sit in the synchronous chapter response path.

### 5.2 Catalog and discovery

- Concurrent home, catalog, genre, tag, format, novel detail and chapter archive navigation.
- Mix common filters and high-cardinality combinations.
- Test pagination at first, middle and deep pages.
- Verify bounded query counts, stable sorting and no unbounded table scans.
- Validate that draft, suspended, rights-blocked and unpublished records never enter public results.

### 5.3 Search and recommendations

- Common and rare search terms, empty results, typo-like queries and repeated queries.
- Search index warm/cold state and controlled index outage.
- Recommendation success, timeout, malformed response and full outage.
- Confirm fallback to safe popular/recent catalog results without blocking home or reader pages.

### 5.4 Concurrent writes and account isolation

- Many users updating their own reading positions and library simultaneously.
- Same user updating the same resource from two devices.
- Conflicting bookmark add/remove operations and retry duplication.
- Attempts to substitute another user's IDs across every private endpoint.
- Confirm optimistic concurrency/version policy and object-level authorization.

### 5.5 Community and abuse pressure

- Comment and reaction bursts on a popular chapter.
- Repeated report submissions, spam-like patterns and rate-limit evasion attempts.
- Moderation queue slowdown and retry behavior.
- Verify that moderation failure does not expose private reports or permit unbounded spam.

### 5.6 Creator and media workflow

- Concurrent draft saves, chapter edits, previews and submissions.
- Media upload validation, large/invalid files, duplicate uploads and object-storage timeout.
- Publication event processing with delayed cache/index consumers.
- Confirm draft privacy and that publication cannot occur without required rights/policy checks.

### 5.7 Payments and financial integrity

- Provider callback success, delayed callback, duplicate callback and out-of-order callback.
- Signature failure, provider timeout, database failure during reconciliation and retry storm.
- Same payment intent processed concurrently by multiple workers.
- Verify one successful payment can create only one corresponding credit; pending state remains pending when outcome is uncertain.
- Use sandbox transactions only. Never generate real charges in load tests.

### 5.8 Failure and recovery drills

- Database latency increase and temporary read/write failure.
- Queue consumer pause, backlog growth, poison message and dead-letter replay.
- Cache outage, purge delay and cold-cache thundering herd.
- Object-storage latency or unavailable asset.
- Search, analytics, notification, AI and provider outage.
- Authorization/ownership service failure.
- Restore from backup in an isolated environment and verify referential integrity.

## 6. Proposed acceptance criteria

These are initial engineering gates to calibrate in staging. They are not production SLOs. The team must revise them based on real platform requirements, Cloudflare plan limits, D1 constraints, measured baseline and budget.

| Measure | Initial proposed gate | Notes |
|---|---|---|
| Correctness | Zero unauthorized data disclosures and zero duplicate financial credits | Hard release blocker |
| Core read availability during optional-service outage | Chapter reading remains available where authoritative content/cache is healthy | Test each optional dependency independently |
| Error rate at a declared stage | Below 1% for core read requests during steady-state run | Exclude intentional fault injection from steady-state calculation; report separately |
| Chapter read latency | p95 below 1.5 seconds warm-cache; p99 below 3 seconds | Staging geography and device/network conditions must be reported |
| Catalog navigation latency | p95 below 2 seconds under the defined workload | Query shape and cache state must be disclosed |
| Protected write correctness | 100% durable commit semantics; retry-safe idempotency | Do not accept silent loss |
| Queue freshness | Normal-priority events processed within a documented target window | Define target only after baseline and service need |
| Cache isolation | Zero private response cross-user cache hits | Hard release blocker |
| Resource bounds | No sustained platform-limit exhaustion or runaway query/request amplification | Record actual Cloudflare/D1 limits and observed headroom |
| Recovery | Documented restore and rollback succeed in rehearsal | Record achieved RPO/RTO; do not invent them |

A stage passes only if correctness, security, and integrity gates pass alongside performance. Fast responses with data leakage or lost writes are failures.

## 7. Stop conditions

Immediately stop or ramp down a test if any of the following occurs:

- Any cross-user or cross-workspace data exposure.
- Any duplicate payment credit, unauthorized publication, or lost committed write.
- Production traffic or real payment activity is affected.
- Database error rate, queue age, Worker limit consumption or provider spend exceeds the approved safety threshold.
- Error rate or latency becomes unstable with no clear recovery.
- Unexpected data mutation or migration behavior occurs.
- Monitoring becomes unavailable and test safety cannot be established.

## 8. Environment and test data

- Dedicated staging Worker/environment and isolated database.
- Synthetic accounts covering guest, reader, author, owner-test and disabled delegated identities.
- Synthetic novels and chapters with explicit test rights metadata.
- No real user passwords, personal data, private drafts or payment details.
- Payment sandbox and test provider credentials stored as secrets.
- Test data reset and cleanup procedure with verification.
- Environment configuration and software commit recorded for every run.

## 9. Test harness and repeatability

Choose a load-testing tool only after confirming compatibility, cost, mobile workflow and ability to target staging safely. The harness must support ramp-up, think time, varied data, authentication, response validation, scenario tagging and exportable metrics.

Each test report must record:

- code commit, build artifact, Worker/database configuration and environment
- test date, region, client/network profile and tool version
- virtual users, ramp-up, duration, request mix and think time
- cache warm/cold state and content distribution
- success/error/timeout counts and response validation
- p50/p95/p99, throughput, cache hit rate and origin amplification
- Worker resource consumption, database metrics, queue depth/age and provider usage
- observed bottleneck, safety stop, deviations and remediation
- exact tested envelope and explicit limits of the conclusion

## 10. Bottleneck diagnosis order

1. Check client and edge cache behavior, including key correctness and hit ratio.
2. Check Worker CPU/duration/subrequest use and request amplification.
3. Inspect D1 query plans, indexes, scans, write contention and connection/request patterns.
4. Inspect queue consumers, event batch size, retries and dead-letter rates.
5. Inspect object storage and provider latency separately from core platform latency.
6. Check payload size, compression, image delivery and mobile rendering costs.
7. Profile expensive UI bundles and route transitions on representative low/mid-range mobile devices.

Do not add infrastructure or rewrite domains based only on a single benchmark. Reproduce the bottleneck and measure the improvement.

## 11. Release capacity statement

After testing, publish a concise capacity statement that identifies:

- maximum tested concurrency and request mix
- whether results were warm-cache, cold-cache or mixed
- geographic region and environment
- p95/p99 latency and error rate
- known bottlenecks and tested failure modes
- operational headroom and rate limits
- what was not tested

Never translate a test of 1,000 virtual users into a claim of 1,000 concurrent human users without validating session behavior, content mix, network, request frequency and real-world variance.

## 12. Execution checklist

- [ ] Staging environment is isolated from production.
- [ ] Synthetic data and test accounts are prepared.
- [ ] Monitoring and stop conditions are active.
- [ ] Baseline 10-user test passes correctness checks.
- [ ] 50-user and 100-user mixed-workload tests complete.
- [ ] 500-user test completes or records the first saturation boundary.
- [ ] 1,000-reader shared-chapter scenario completes with measured cache behavior.
- [ ] Cold-cache, spike, write, search, auth and mobile scenarios complete.
- [ ] Queue, database, cache, object-storage, provider and authorization failure drills complete.
- [ ] Payment sandbox retry/deduplication tests pass.
- [ ] Security negative tests run under load.
- [ ] Backup restore and deployment rollback are rehearsed.
- [ ] Findings are prioritized and retested after fixes.
- [ ] Capacity statement is reviewed and approved before public scale claims.

**Current phase result:** Test plan drafted only. No concurrency test, benchmark, SLO, capacity limit, or production readiness result has been measured.

---

**Next step:** reconcile this architecture against the live source code and actual D1 migrations, beginning with API methods, authorization checks, route dispatch and schema inventory.