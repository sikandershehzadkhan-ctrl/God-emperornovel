# Imperial Novel — Phase 01M.3 OmniPortal and Trend Factory Screen Blueprint

**Product:** Imperial Novel  
**Brand:** Read • Create • Conquer  
**Workstream:** Master architecture, Phase 01M  
**Branch:** `architecture/phase-01m-screen-blueprint`  
**Status:** Architecture specification in progress. This document does not enable providers, import third-party content, alter production data, execute migrations, merge application code, or deploy.

## 1. Purpose and non-negotiable boundaries

OmniPortal and Trend Factory are separate capabilities with a controlled relationship:

- **OmniPortal** manages external source/provider discovery, metadata resolution, matching, rights evidence, provider health, authorized import requests, and provenance.
- **Trend Factory** gathers permitted trend signals, normalizes observations, measures changes, creates explainable reports, and routes candidates for editorial review.
- Trend Factory may use OmniPortal provider metadata only when the provider's terms and permission scope allow that use.
- Neither system is a mechanism for bypassing copyright, access controls, paywalls, rate limits, robots policies, or provider terms.
- Discovery of a title or metadata match does not grant the right to copy or republish chapters, covers, translations, illustrations, or other protected material.
- No connector is activated merely because a screen exists. Provider activation requires a documented legal basis, explicit permissions, security review, and operational approval.
- A provider health status is not an endorsement of the provider's content rights.
- A trend score is not a verified popularity fact unless its source, method, time window, sample coverage, and confidence are disclosed.

## 2. OmniPortal product model

OmniPortal is an internal rights-aware source integration workspace, not a public scraper. Its primary workflow is:

**Register provider → Review terms and permissions → Configure credentials/scopes → Health-check → Discover metadata → Resolve/match → Verify rights → Submit import request → Human review → Authorized metadata/content import → Provenance and audit.**

The platform must support metadata-only providers, licensed-content providers, internal catalog sources, and disabled/unverified providers as distinct capability classes.

### Provider capability vocabulary

Each provider record declares capabilities independently:
- Metadata discovery.
- Metadata retrieval.
- Cover/image retrieval.
- Chapter text retrieval.
- Translation retrieval.
- Licensed distribution.
- Rights evidence retrieval.
- Webhook/event delivery.
- Usage/quota information.

Each capability has status: unavailable, unknown, disabled, pending review, approved, suspended, revoked. A provider can be approved for metadata discovery and explicitly forbidden for chapter-body retrieval.

### Provider status model

- **Unregistered:** not yet evaluated.
- **Pending review:** terms, identity, permission, or security assessment incomplete.
- **Approved, disabled:** eligible but not activated.
- **Active:** enabled for explicitly approved capabilities.
- **Degraded:** service health or quota issue.
- **Suspended:** temporarily disabled pending review.
- **Revoked:** permission withdrawn; all associated jobs stop.
- **Retired:** no longer used; historical audit retained.

Provider health and permission status are separate dimensions. A healthy endpoint does not imply authorization.

## 3. OmniPortal screen blueprint

### OMP-001 — OmniPortal overview
**Route proposal:** `/omniportal`  
**Shell:** Admin/data workspace.  
**Audience:** users with explicit OmniPortal read permission.

**Sections:** provider status summary, pending rights reviews, active authorized jobs, recent discovery activity, failed jobs, permission expiry alerts, import approval queue, and audit summary.

**Rules:** show counts from persisted records; display generated-at time; isolate failed widgets; do not show provider secrets or raw credentials.

### OMP-002 — Provider directory
**Route:** `/omniportal/providers`  
List provider name, category, permission state, enabled capabilities, health, last check, quota state, and owner/approver. Filters by permission, capability, health, region, and status.

**Interactions:** open provider details; request review; pause an active provider where authorized; inspect audit. No one-click activation that bypasses review.

### OMP-003 — Provider detail
**Route:** `/omniportal/providers/:providerId`  
Tabs: overview, terms and legal basis, capabilities, credentials/scopes, health, quotas, history, permissions, jobs, audit.

**Credential handling:** secrets are write-only or masked after entry; never returned in ordinary API responses, logs, analytics, or UI hydration. Credential rotation is explicit and auditable.

### OMP-004 — Provider permissions
**Route:** `/omniportal/providers/:providerId/permissions`  
Record the legal basis, source terms URL/version/hash where available, permitted data types, permitted operations, geographic restrictions, retention, attribution requirements, rate limits, expiry/review date, and approving actor. Permission is least-privilege and revocable.

### OMP-005 — Provider health
**Route:** `/omniportal/providers/:providerId/health`  
Show last check, latency distribution, success/error rate, timeout rate, quota signals, and recent incidents. Distinguish unavailable from not checked. Health probes must be low-impact and within provider terms. Do not leak internal network details.

### OMP-006 — Provider settings
**Route:** `/omniportal/providers/:providerId/settings`  
Configure approved base URL, request timeout, allowed endpoints, rate/concurrency ceilings, retry policy, data retention, and safe headers. Block arbitrary URL schemes, private-network targets, redirects to disallowed hosts, and SSRF paths. Any endpoint change triggers security revalidation.

### OMP-007 — Discovery workspace
**Route:** `/omniportal/discover`  
Search authorized metadata sources by title, author, language, identifier, and supported taxonomy. Each result displays provider attribution, source timestamp, retrieval time, confidence, and known rights state. Clearly label unverified metadata.

### OMP-008 — Novel discovery
**Route:** `/omniportal/discover/novels`  
Filter source metadata by language, format, status, author, provider, and identifiers. Search only approved metadata capabilities. Do not retrieve chapter bodies as a side effect.

### OMP-009 — Author discovery
**Route:** `/omniportal/discover/authors`  
Resolve public author metadata where provider terms permit. Distinguish source identity from verified Imperial Novel account identity. Never merge accounts solely on matching display names.

### OMP-010 — Genre discovery
**Route:** `/omniportal/discover/genres`  
Map external taxonomy to Imperial Novel taxonomy using versioned mapping records and human review for ambiguous mappings. Preserve source labels and locale.

### OMP-011 — Match resolution
**Route:** `/omniportal/matches`  
Show candidate matches with normalized identifiers, title/author/language similarity, source provenance, confidence factors, and possible conflicts. Similarity score is a suggestion, not an automatic identity decision.

### OMP-012 — Match detail
**Route:** `/omniportal/matches/:matchId`  
Compare source metadata against Imperial Novel catalog metadata. Show differences, conflicting fields, confidence explanation, rights state, and reviewer decision. Match decisions are versioned and auditable.

### OMP-013 — Duplicate candidates
**Route:** `/omniportal/duplicates`  
Queue likely duplicates. Provide side-by-side comparison and explain candidate-generation method. No automatic deletion, merge, or ownership transfer. Human reviewer approves merge; preserve aliases, IDs, provenance, and redirect behavior.

### OMP-014 — Duplicate detail
**Route:** `/omniportal/duplicates/:candidateId`  
Actions: mark distinct, link as same work, defer, request more evidence. Merge requires explicit confirmation, a rollback strategy, and audit event.

### OMP-015 — Metadata records
**Route:** `/omniportal/metadata`  
Search source metadata records with source identity, retrieval timestamp, schema version, field-level provenance, and review state.

### OMP-016 — Metadata detail
**Route:** `/omniportal/metadata/:recordId`  
Show source fields, normalized fields, mapping history, provenance, rights flags, and permitted reuse scope. Avoid overwriting editor-curated catalog fields with lower-confidence provider data.

### OMP-017 — Import requests
**Route:** `/omniportal/requests`  
List submitted, pending, approved, rejected, cancelled, and expired requests. Each request states exactly which data types and fields are requested, source provider, purpose, rights basis, retention, attribution, and destination.

### OMP-018 — New import request
**Route:** `/omniportal/requests/new`  
Wizard: select provider → select source record → choose permitted data fields → attach rights evidence → preview import → submit for review. Chapter text and media are excluded unless the provider permission explicitly allows the exact material and the rights reviewer approves it.

### OMP-019 — Import request detail
**Route:** `/omniportal/requests/:requestId`  
Show request scope, evidence, reviewer decisions, approvals, comments, and audit. Changes to requested scope create a new review version.

### OMP-020 — Rights review
**Route:** `/omniportal/rights`  
Central queue for content ownership, license, attribution, territory, term, permitted format, derivative/translation rights, and withdrawal checks. Rights reviewers can approve only within their assigned scope.

### OMP-021 — Rights verification detail
**Route:** `/omniportal/rights/:rightsId`  
Evidence timeline, claimants, source documents, verification status, restrictions, expiry, and review outcome. Separate author attestation, documentary evidence, provider assertion, and independently verified license.

### OMP-022 — Licenses
**Route:** `/omniportal/licenses`  
Search license records, allowed uses, territories, expiration, attribution requirements, derivative rights, sublicensing restrictions, and revocation state.

### OMP-023 — Rights claims
**Route:** `/omniportal/claims`  
Queue copyright/ownership disputes. Provide restricted evidence access, case history, temporary protective actions, response deadlines, and appeal/counter-notice path according to applicable policy.

### OMP-024 — Integrations
**Route:** `/omniportal/integrations`  
List approved internal and external integrations, scopes, owners, health, credentials status, and revocation. New integration requires threat model and explicit approval.

### OMP-025 — Webhooks
**Route:** `/omniportal/webhooks`  
Manage endpoint, event allowlist, signing secret rotation, delivery attempts, replay protection, retry windows, and disable action. Never expose signing secrets after creation.

### OMP-026 — Import history
**Route:** `/omniportal/import-history`  
Immutable history of attempted and completed imports, actor, source, scope, outcome, records changed, rights approval, and rollback/reference information.

### OMP-027 — Jobs
**Route:** `/omniportal/jobs`  
Queue and job state: queued, running, retrying, completed, failed, cancelled, blocked by rights, blocked by provider, expired. Show progress only when backed by actual job checkpoints.

### OMP-028 — Job detail
**Route:** `/omniportal/jobs/:jobId`  
Show input scope, provider, permission snapshot, attempts, timestamps, result summary, error category, retry eligibility, and audit references. Redact tokens, sensitive payloads, and private content.

### OMP-029 — Logs and audit
**Routes:** `/omniportal/logs`, `/omniportal/audit`  
Role-scoped logs with correlation IDs, actor, provider, action, timestamp, result, and sanitized error. Logs are not a substitute for immutable audit records.

### OMP-030 — OmniPortal settings
**Route:** `/omniportal/settings`  
Global defaults for quotas, retention, approval policy, provider review cadence, and feature flags. Security-sensitive changes require step-up authentication and approval.

## 4. Trend Factory product model

Trend Factory is a provenance-first trend observation and editorial intelligence system. It does not manufacture popularity or scrape arbitrary websites.

### Signal types
- Provider-published public trend/ranking data where terms allow.
- Official APIs and permitted RSS feeds.
- Imperial Novel's own first-party events, aggregated and privacy-protected.
- Licensed research datasets with explicit usage scope.
- Manually curated editorial observations, clearly labelled as editorial.

### Trend record contract

Every trend record must include:
- Stable trend ID and normalized topic/entity.
- Source ID and source type.
- Source URL/reference where permitted.
- Observed value and metric definition.
- Observation timestamp and ingestion timestamp.
- Measurement window and timezone.
- Region and language.
- Sample coverage and missing-data notes.
- Confidence and methodology version.
- Freshness state and last successful source check.
- Rights/terms scope and retention expiry.
- Reviewer and publication approval state.
- Change history and audit reference.

A trend score is a derived estimate with an explainable formula and version. Do not present it as an absolute truth or compare scores across incompatible sources/windows.

## 5. Trend Factory screen blueprint

### TRF-001 — Overview
**Route:** `/trend-factory`  
Show source health, recently observed trends, emerging/declining candidates, pending editorial reviews, pipeline jobs, stale datasets, and reports. Each widget shows generated-at time and source coverage.

### TRF-002 — Dashboard
**Route:** `/trend-factory/dashboard`  
Configurable overview for authorized analysts/editors. Avoid exposing private user-level behavioral data. Aggregate first-party activity with minimum cohort thresholds and privacy policy.

### TRF-003 — Trend discovery
**Route:** `/trend-factory/discover`  
Search topics, genres, authors, titles, regions, and languages from approved sources. Display source attribution and source freshness before any trend interpretation.

### TRF-004 — Trend directory
**Route:** `/trend-factory/trends`  
Filter by category, direction, region, language, source, confidence, and observation window. Clearly distinguish external trends from Imperial Novel internal engagement signals.

### TRF-005 — Trend detail
**Route:** `/trend-factory/trends/:trendId`  
Show time series, observations, methodology, source coverage, confidence, region/language, caveats, and change log. A missing observation is a gap, not zero.

### TRF-006 — Emerging trends
**Route:** `/trend-factory/emerging`  
Define emergence using a versioned baseline, minimum observation count, change threshold, and source quality. Explain why a topic qualifies. Suppress low-sample candidates.

### TRF-007 — Declining trends
**Route:** `/trend-factory/declining`  
Require sufficient historical coverage and comparable windows. Distinguish genuine decline from source outage or seasonal variation.

### TRF-008 — Regional trends
**Route:** `/trend-factory/regional`  
Show only regions with sufficient lawful signal coverage. Do not infer a user's precise location from reading behavior. Region aggregation must meet privacy thresholds.

### TRF-009 — Language trends
**Route:** `/trend-factory/languages`  
Separate source language from translated language and user interface locale. Support RTL metadata and locale-aware topic normalization.

### TRF-010 — Reports
**Route:** `/trend-factory/reports`  
List generated reports with owner, scope, sources, methodology version, created time, and approval status.

### TRF-011 — Report detail
**Route:** `/trend-factory/reports/:reportId`  
Include executive summary, methodology, charts/tables, sources, uncertainty, coverage gaps, and recommendations. Clearly label machine-generated insights and human editorial conclusions.

### TRF-012 — Source directory
**Route:** `/trend-factory/sources`  
List approved sources with terms status, data types, cadence, freshness, owner, health, and last review. A source can be used for metadata but not trend publication if rights/terms do not permit.

### TRF-013 — Add source
**Route:** `/trend-factory/sources/new`  
Source intake: source identity, owner, URL, terms, data category, access method, rate limits, retention, attribution, geographic/language scope, and reviewer. New sources begin disabled/pending review.

### TRF-014 — Source detail
**Route:** `/trend-factory/sources/:sourceId`  
Show permission snapshot, source schema, health, schedule, recent observations, failures, and review history.

### TRF-015 — RSS feeds
**Routes:** `/trend-factory/rss`, `/trend-factory/rss/:feedId`  
Validate feed URL, publisher identity, terms, redirects, content types, and request frequency. Store only permitted metadata/excerpts and attribution. Do not ingest full copyrighted article bodies into novel content.

### TRF-016 — Integrations
**Routes:** `/trend-factory/integrations`, `/trend-factory/integrations/:integrationId`  
Manage approved API connectors, scopes, credentials, quota, health, and revocation. Credentials are masked and never logged.

### TRF-017 — Pipeline
**Route:** `/trend-factory/pipeline`  
Stages: scheduled fetch → validation → normalization → deduplication → observation storage → trend calculation → confidence checks → editorial review → approved publication/export.

### TRF-018 — Pipeline job detail
**Route:** `/trend-factory/pipeline/:jobId`  
Show stage checkpoints, source version, retry state, input/output counts, errors, and provenance. Retry must be idempotent and respect current source permissions.

### TRF-019 — Review queue
**Route:** `/trend-factory/review`  
Editors inspect trend claims, source evidence, methodology, and public wording. Review decisions are versioned and auditable.

### TRF-020 — Review detail
**Route:** `/trend-factory/review/:reviewId`  
Approve, reject, request evidence, or revise wording. Approval applies only to the exact report/trend version reviewed.

### TRF-021 — Approved trends
**Route:** `/trend-factory/approved`  
List approved trend records and their publication/export destinations. Revoked source permission invalidates downstream eligibility and triggers review.

### TRF-022 — Publishing and exports
**Route:** `/trend-factory/publishing`  
Allow only approved, rights-cleared summaries and metadata. Public-facing statements must include source/date/window and avoid unsupported causal claims.

### TRF-023 — Analytics
**Route:** `/trend-factory/analytics`  
Measure source freshness, pipeline reliability, review turnaround, coverage, and trend forecast quality. Do not treat number of trends published as quality.

### TRF-024 — Settings
**Route:** `/trend-factory/settings`  
Configure permitted cadence, retention, confidence thresholds, minimum sample rules, region/language scopes, and alerting. Material changes require versioning and audit.

### TRF-025 — Logs
**Route:** `/trend-factory/logs`  
Sanitized technical logs with correlation IDs and retention limits. Sensitive source credentials and private user-level events must never appear.

## 6. Shared permission model

Suggested permission namespace:
- `omniportal.read`
- `omniportal.provider.read`
- `omniportal.provider.propose`
- `omniportal.provider.configure`
- `omniportal.provider.activate`
- `omniportal.provider.revoke`
- `omniportal.discovery.run`
- `omniportal.match.review`
- `omniportal.rights.read`
- `omniportal.rights.review`
- `omniportal.import.request`
- `omniportal.import.approve`
- `omniportal.import.execute`
- `omniportal.audit.read`
- `trend.read`
- `trend.source.propose`
- `trend.source.configure`
- `trend.pipeline.run`
- `trend.review`
- `trend.publish`
- `trend.settings.manage`
- `trend.audit.read`

ABAC conditions include active account, explicit assignment, provider permission scope, source status, rights status, region, expiry, and job ownership. No client-side role flag grants access. High-risk operations require step-up authentication and, where configured, dual approval.

## 7. API contract groups to reconcile

These are logical API families, not claims that all endpoints currently exist:
- Providers: list/detail/propose/update/health/permission review/activate/suspend/revoke.
- Discovery: submit query, retrieve result pages, resolve candidate, inspect provenance.
- Matching: create candidate set, compare metadata, review decision, merge authorization.
- Rights: submit evidence, inspect license, review claim, revoke permission, record appeal.
- Imports: create request, review request, execute approved scope, inspect job, cancel, rollback/compensate where possible.
- Trend sources: propose, review, configure, health, schedule, revoke.
- Observations: ingest permitted signal, validate, normalize, deduplicate, query by time/source/region/language.
- Trends: calculate, inspect, compare compatible windows, record confidence and methodology.
- Reports: generate, review, approve, publish, revoke, export.
- Operations: jobs, logs, audit, metrics, health, settings.

Every mutation is authenticated, authorized server-side, schema-validated, rate-limited, idempotent where appropriate, and audit-recorded. All job APIs return a stable job identifier and an explicit lifecycle state.

## 8. Real-time and freshness requirements

- Provider health is refreshed according to an approved schedule, not by every page view.
- Discovery results carry source-observed and platform-retrieved timestamps.
- Trend records carry observation windows and ingestion timestamps.
- Pipeline screens update through authenticated events when supported; otherwise bounded polling is labelled as polling.
- Event streams are not the source of truth. Clients recover missed updates from persisted job/observation records.
- Stale, delayed, partial, and unavailable states must be visually distinct.
- Source outages must not be interpreted as a fall in popularity.
- Trend calculations are versioned and reproducible from retained lawful observations.

## 9. SSRF, credential and provider security

- Permit HTTPS only unless a narrowly justified exception is security-reviewed.
- Block loopback, link-local, private, metadata-service, and reserved IP ranges after DNS resolution; revalidate redirects and DNS changes.
- Enforce provider host allowlists and redirect limits.
- Apply per-provider request quotas, concurrency ceilings, response-size caps, content-type validation, and timeouts.
- Never execute provider-supplied scripts or render untrusted HTML without sanitization.
- Store credentials in platform secret storage, not ordinary D1 rows or client bundles.
- Redact credentials, authorization headers, personal data, and private source payloads from logs.
- Require signed webhook verification, replay protection, bounded retries, and endpoint revocation.
- Provide kill switch per provider and global integration shutdown.
- Preserve evidence and audit trail for permission revocation and downstream data review.

## 10. Acceptance tests

### OmniPortal
- A metadata-only provider cannot return chapter bodies through any UI or API path.
- Disabled, pending, suspended, or revoked providers cannot execute jobs.
- Expired permission blocks new jobs and flags existing imported records for review.
- Provider redirects cannot reach private network or metadata endpoints.
- Secrets never appear in API responses, browser bundles, error messages, or logs.
- Duplicate matches require reviewer decision; no silent merge/delete.
- Import job cannot exceed the exact approved field/content scope.
- Retry is idempotent and audit records preserve each attempt.
- Rights claim can suspend affected import/publishing capability without destroying evidence.
- Provider health failures do not rewrite trend observations as zero.

### Trend Factory
- Every public trend statement links to source, observation time, window, and methodology.
- Incompatible sources/windows are not combined into a single score without a documented normalization method.
- Low-sample and stale data are suppressed or visibly qualified.
- RSS and API ingestion respects terms, rate limits, attribution, and retention.
- Pipeline retries do not duplicate observations.
- Reviewer approval applies only to the reviewed version.
- Source revocation invalidates downstream publication eligibility.
- Regional analytics enforce privacy thresholds and avoid precise user location exposure.
- Public report export omits private user-level data and credentials.

## 11. Unresolved reconciliation tasks

- [ ] Inspect actual OmniPortal provider registry, permission schema, status and health handlers.
- [ ] Verify deduplication behavior in current production versus feature branch.
- [ ] Inspect actual discovery, resolve, import, job, and smart-unlock API contracts.
- [ ] Determine whether import operations currently retrieve metadata only or content bodies.
- [ ] Verify actual provider terms/rights evidence storage and approval controls.
- [ ] Inspect Trend Factory source registry, observation tables, pipeline jobs, and report APIs.
- [ ] Confirm which trend sources are permitted and which are disabled.
- [ ] Verify event delivery transport and freshness for provider/job/trend updates.
- [ ] Reconcile OMP/TRF permissions with Phase 01I and API groups with Phase 01J.
- [ ] Reconcile entity proposals with existing D1 migrations from Phase 01K.
- [ ] Verify each route and shell against Phase 01M.1 and 01M.2.
- [ ] Obtain architecture review before engineering implementation.

## 12. Evidence boundary

This is a product architecture specification. Earlier read-only observations noted a production OmniPortal status response with repeated provider entries and a feature-branch status handler that deduplicated provider snapshots; this document does not assert that production has been fixed. No provider was activated, no third-party content was imported, no rights were presumed, no database was modified, and no deployment was performed.


---

## 13. Screen inventory expansion and shared page contracts

The following route families complete the operational journey around the screen set above. They are route proposals and must be reconciled with the live route dispatcher before implementation.

### OmniPortal extended screens

| Screen ID | Route proposal | User outcome | Required contract |
|---|---|---|---|
| OMP-031 | `/omniportal/providers/:providerId/capabilities` | Inspect exactly what a provider is allowed to supply | Field-level scope, legal basis, reviewer, expiry |
| OMP-032 | `/omniportal/providers/:providerId/terms` | Inspect terms and license history | Versioned terms snapshot and attribution |
| OMP-033 | `/omniportal/health` | Compare provider health | Check method, last success, latency, stale state |
| OMP-034 | `/omniportal/approvals` | Review pending requests | Queue ownership, SLA, decision reason |
| OMP-035 | `/omniportal/approvals/:approvalId` | Decide a specific request | Exact version and scope being approved |
| OMP-036 | `/omniportal/collections` | Save reusable discovery sets | Private by default, explicit sharing |
| OMP-037 | `/omniportal/collections/:collectionId` | Manage a saved set | Owner/member ACL and source freshness |
| OMP-038 | `/omniportal/status` | View safe service availability | Aggregated status only, no secrets/evidence |

### Trend Factory extended screens

| Screen ID | Route proposal | User outcome | Required contract |
|---|---|---|---|
| TRF-026 | `/trend-factory/observations` | Inspect source observations | Provenance, source time, collection time |
| TRF-027 | `/trend-factory/observations/:id` | Audit a single observation | Immutable source snapshot reference |
| TRF-028 | `/trend-factory/methodology` | Understand how trends are derived | Version, definitions, caveats |
| TRF-029 | `/trend-factory/coverage` | Understand source and locale gaps | Coverage denominator and known blind spots |
| TRF-030 | `/trend-factory/alerts` | Manage stale-source and pipeline alerts | Threshold, owner, delivery status |

Every screen must specify the shared registry fields from Phase 01M.1: entry/exit paths, shell, component inventory, API/data contract, authorization, freshness, localization, responsive behavior, accessibility, page states, analytics and acceptance tests.

## 14. Import and publication state machines

### 14.1 OmniPortal import request

Allowed lifecycle:

`draft → submitted → rights_review → duplicate_review → content_scope_review → approved → queued → running → validated → completed`

Terminal or blocking states:

`rejected`, `cancelled`, `expired`, `blocked_by_rights`, `blocked_by_provider`, `failed`, `needs_evidence`.

Rules:
- A request cannot skip rights review because the provider is already technically connected.
- A scope change creates a new immutable request version and invalidates prior approval for the changed fields.
- A failed fetch never produces a partially approved catalog record.
- A partial import records each accepted/rejected field and its reason.
- Retry is permitted only for retryable errors and uses an idempotency key.
- Revocation blocks queued jobs and prevents new work; already imported records enter a rights-impact review rather than being silently erased or silently retained for unrestricted use.

### 14.2 Trend review and publication

Allowed lifecycle:

`candidate → evidence_check → methodology_check → editorial_review → approved → scheduled → published`

Alternative states:

`needs_more_data`, `needs_revision`, `rejected`, `withdrawn`, `stale`, `source_revoked`.

A publication approval binds to an exact immutable trend/report version. If observations, methodology, source rights or public wording change materially, the item returns to review. A scheduled item is automatically held if its evidence crosses the configured staleness threshold before publication.

## 15. Trend measurement and confidence framework

Trend Factory must not ship an opaque “AI trend score”. The initial product should expose a small set of explainable measurements:

- **Observed volume:** count/value reported by one source within its own defined window.
- **Relative change:** comparison against a prior, comparable window.
- **Persistence:** number of consecutive windows in which a signal remains above a documented threshold.
- **Source diversity:** number of independent eligible sources contributing evidence.
- **Coverage:** proportion of expected source/window observations actually available.
- **Freshness:** elapsed time since the last successful observation.
- **Confidence tier:** qualitative assessment based on sample sufficiency, source reliability, coverage and consistency.

Do not combine incompatible units or incomparable source rankings. If sources have different definitions, show them separately until a defensible normalization is validated. Seasonal effects, source outages, algorithm changes, reposts, bots, duplicate items and language ambiguity are known confounders and must be recorded where detectable.

A trend can be:
- **High confidence:** adequate sample, multiple independent sources or a strong validated first-party signal, comparable windows, acceptable freshness.
- **Moderate confidence:** usable but limited coverage, or one important caveat.
- **Low confidence:** weak sample, single-source signal, uncertain normalization or stale observations.
- **Insufficient evidence:** below minimum threshold; excluded from ranked/public lists.

These tiers are provisional product labels. Thresholds require back-testing and editorial approval before production use.

## 16. Data freshness service-level labels

Freshness is defined per source and metric, not globally. Each source profile must state its expected update cadence and tolerated delay.

| Freshness state | Meaning | UI behavior |
|---|---|---|
| Fresh | Within the source-specific target window | Show timestamp and normal value |
| Aging | Near the end of target window | Show timestamp and aging label |
| Stale | Outside target window | Show stale warning; exclude from “current” claims |
| Delayed | Collection is behind schedule or failing | Show last successful time and delay |
| Unknown | No trustworthy cadence or timestamp | Do not claim currentness |
| Unavailable | No valid observation exists | Show unavailable, never zero |

Polling interval must not be shorter than necessary for the underlying source cadence. Hidden tabs pause nonessential refresh. Push updates, if added later, must have persisted event IDs and a recovery query so reconnecting clients cannot miss durable state changes.

## 17. Additional security and abuse controls

- Treat provider metadata, descriptions, image URLs, RSS fields and trend labels as untrusted input.
- Apply HTML sanitization and strict URL policies before rendering or linking provider-supplied content.
- Do not fetch user-supplied image URLs from the Worker without the same SSRF, host, size and content-type controls.
- Restrict source onboarding to staff; user-submitted provider suggestions are inert records until reviewed.
- Require dual control for provider activation, permission expansion, bulk import, rights overrides and publication of sensitive/high-impact claims.
- Maintain a global kill switch and per-provider kill switch. Both must stop queued work as well as future scheduling.
- Rate-limit by user, provider, endpoint and global concurrency. A single provider outage must not exhaust Worker CPU, outbound fetch capacity or D1 write capacity.
- Keep raw provider payload retention minimal and rights-scoped. Prefer storing only the permitted normalized fields and a provenance reference.
- Record source terms snapshots so later permission changes can be evaluated against the terms in force at collection time.
- Ensure audit records are append-only to ordinary operators. Corrections are new events, not edits that erase history.

## 18. Proposed API response envelopes

All future API responses should use stable envelopes and explicit freshness. Examples below are illustrative contract shapes, not existing endpoint responses.

### Provider summary

```json
{
  "provider": {
    "id": "provider-id",
    "name": "Provider name",
    "permission_state": "approved",
    "enabled_capabilities": ["metadata_search"],
    "health_state": "degraded",
    "last_checked_at": "2026-11-01T10:00:00Z"
  },
  "freshness": {
    "state": "aging",
    "as_of": "2026-11-01T10:00:00Z"
  }
}
```

### Trend record

```json
{
  "trend": {
    "id": "trend-id",
    "topic": "Example topic",
    "direction": "rising",
    "confidence": "moderate",
    "methodology_version": "1",
    "measurement_window": {
      "start": "2026-10-25T00:00:00Z",
      "end": "2026-11-01T00:00:00Z"
    },
    "observation_count": 12,
    "source_count": 3,
    "freshness_state": "fresh",
    "editorial_state": "needs_review"
  }
}
```

Identifiers and values above are examples only. Do not treat them as seeded production records or real-time information.

## 19. Review checklist before implementation

- [ ] Product/legal review approves the provider capability matrix and evidence standard.
- [ ] Security review signs off SSRF, credentials, quotas, webhook and kill-switch controls.
- [ ] Existing connector and import code is mapped to each state transition.
- [ ] Actual D1 migrations are inspected before any schema proposal is finalized.
- [ ] Existing production and feature-branch route/API behavior is compared.
- [ ] Trend source rights, metrics and cadence are approved individually.
- [ ] Trend confidence and ranking methodology is back-tested on representative data.
- [ ] Editor workflow, dual approval and withdrawal behavior are tested.
- [ ] Mobile, accessibility, performance and failure-state prototypes are reviewed.
- [ ] Only then may an implementation plan be opened. No production activation is implied by architecture completion.

## 20. Increment completion statement

This increment expands the screen inventory, workflow state machines, data freshness model, trend confidence methodology, security controls and API response contracts. It remains architecture documentation only. No application source, production configuration, connector permission, provider state, D1 record, migration, secret, deployment or live third-party service was changed.
