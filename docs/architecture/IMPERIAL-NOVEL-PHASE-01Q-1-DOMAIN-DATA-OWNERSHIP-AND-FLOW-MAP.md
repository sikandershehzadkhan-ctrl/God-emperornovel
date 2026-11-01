# Imperial Novel | Phase 01Q.1: Domain Data Ownership & Flow Map

**Parent:** Phase 01Q Complete Platform Reference Architecture  
**Status:** Target data ownership and flow contract. Existing tables and code paths must be verified against the selected production baseline before implementation.

## 1. Purpose

This document answers four questions for every data family:
1. Which domain owns the data and its invariants?
2. Which actor may read or mutate it?
3. Which other domains may consume it, and in what form?
4. Which events, audit records and tests prove the flow is safe?

A table's physical location in D1 does not make it globally accessible. Domain ownership is a code and policy boundary even when the initial deployment uses one relational database.

## 2. Data ownership rules

- Every table has one owning domain and one accountable migration owner.
- A domain may expose read models to other domains, but consumers do not write around the owner.
- User-owned rows carry a stable owner/principal relationship. Queries scope by authenticated principal.
- Child rows inherit or validate parent ownership. A child ID alone is never sufficient authority.
- Public projections contain only fields approved for public disclosure.
- Sensitive data is not copied into analytics, search, logs, events or caches without a documented purpose and minimization rule.
- Cross-domain workflows use a domain operation or durable event/outbox, with idempotency and retry rules.
- Schema changes are migration-led and accompanied by data-preservation tests.
- Staff access is a separate scoped grant, not an implicit bypass of ownership.
- No table is considered fully inventoried until its columns, constraints, indexes, triggers, queries, retention and migrations are verified.

## 3. Domain-to-entity ownership matrix

The entity groups below are the target logical ownership model. Names are conceptual unless explicitly described as observed in the existing migration/runtime audit.

| Domain | Entity groups owned | Primary owner key / scope | Data class |
|---|---|---|---|
| Identity & Access | users, sessions, account-state history, role assignments, permissions, grants, recovery/security events | user_id; staff grant scope | Sensitive / restricted |
| Catalog | novels, chapters, genres, tags, novel_genres, novel_tags, collections, language metadata, content warnings | novel_id; publication/rights state | Public + restricted drafts |
| Reading | reading_positions, history, bookmarks, follows, user_library, unlock entitlements | user_id + resource_id | User-private |
| Creator | author applications, author workspace, drafts, editorial submissions, schedules, creator analytics | owner_user_id; author assignment | User-private / sensitive |
| Community | comments, comment likes, reactions, reviews, reports, moderation cases, appeals, blocks/mutes | actor_user_id; case assignment | Public + sensitive case data |
| Commerce | ticket products, orders, donation/payment claims, ticket_ledger, refunds, reconciliation | account owner + transaction ID | Sensitive / financial |
| Rights & Publishing | rights declarations, evidence, review decisions, publication approvals and audit trail | work_id + reviewer assignment | Sensitive / restricted |
| OmniPortal | providers, connector authorizations, credential references, source records, import jobs and provenance | provider_id + authorization scope | Restricted / sensitive |
| Trend Factory | source observations, candidate topics, trend scores, editorial decisions and provenance | source_id + candidate_id | Internal / licensed metadata |
| AI Studio | AI projects, prompt metadata, generation jobs, outputs, usage and cost records | owner_user_id + project_id | User-private / sensitive |
| Analytics | event definitions, deduplicated events, aggregate metrics and reporting snapshots | event scope; aggregation cohort | Internal / aggregated |
| Operations | audit events, outbox, job runs, incidents, feature flags, schema history and health snapshots | actor/service + resource scope | Sensitive / restricted |

## 4. Known existing-schema evidence and limitations

The Phase 01O schema audit observed the following in the reviewed architecture-branch migration/runtime sources:
- Initial migration 0001 creates users, sessions, novels, chapters, genres, tags, novel_genres, novel_tags, unlocks, unlock_batches, bookmarks, history, donations, connectors, comments, novel_requests and audit_logs.
- Migration 0003 adds ticket_ledger, follows, ratings, reports, notifications and app_settings.
- Migration 0004 adds novel publication/rights columns.
- Migration 0005 adds chapter publication_status and chapter_views.
- Migration 0011 adds author applications.
- Migration 0016 adds reading_positions.
- Runtime schema helpers add further feature structures, including auth_rate_limits, comment_likes, comment_reports, novel_reactions and request_votes, plus comment threading/edit columns.
- The reviewed architecture branch did not contain migration 0012; a candidate migration exists on a divergent branch and is not approved merely by existing.

This list is not a complete live-schema inventory. It does not prove that production D1 has exactly these objects or that every target entity group already exists. In particular, AI, OmniPortal, Trend Factory, normalized authorization, support cases, outbox and expanded commerce structures require a full source and deployed-schema inventory.

## 5. User-owned data isolation matrix

| Resource | Owner identity | Read policy | Write policy | Cross-user test |
|---|---|---|---|---|
| Profile private settings | authenticated user | owner only; public profile is separate projection | owner only; allowlisted fields | A cannot read/update B private settings |
| Reading history / positions | authenticated user | owner only | owner only; server validates chapter eligibility | A cannot read, overwrite or delete B progress |
| Library / bookmarks | authenticated user | owner only | owner only; unique per-user relation | A cannot mutate B bookmark |
| Private messages | participant IDs | sender/recipient or assigned safety role under policy | participant policy; moderation is separate | nonparticipant cannot read, edit or export |
| Draft novels / chapters | owner_user_id | owner and explicitly assigned reviewer | owner; reviewer only through workflow actions | A cannot read/update/delete B draft |
| AI projects and outputs | owner_user_id | owner; time-bound support exception if policy allows | owner; jobs scoped to project owner | A cannot run, cancel or export B project |
| Ticket ledger / payment evidence | account owner | owner for own records; finance roles scoped | ledger service only; staff actions permissioned | A cannot inspect B balance/evidence |
| Notifications | recipient_user_id | recipient only | recipient may mark own read state; system creates | A cannot read/mark B notification |
| Support cases | requester + assigned staff | requester-safe view and assigned staff view | case workflow only | unrelated user/staff denied |
| Moderation reports | reporter + assigned case scope | minimal reporter view; assigned reviewers | case workflow; immutable audit | unrelated staff cannot browse all reports |
| Private analytics | owner_user_id | owner only | server-generated events | A cannot view B dashboard/export |

The owner column must not be set from a request body. It is derived from the verified session or a trusted system actor. Staff exceptions require separate permission, assignment, purpose, expiry and audit.

## 6. Domain data flows

### 6.1 Reader opens a published chapter
1. Request resolves canonical novel/chapter IDs.
2. Catalog checks public publication and rights eligibility.
3. Reading checks authentication only for private progress or entitlement operations.
4. Commerce entitlement service checks whether the chapter is free or unlocked.
5. Reader response contains only fields the user may access.
6. Reading-position write is scoped to the authenticated user and chapter.
7. View analytics are deduplicated and aggregated under the metric definition.

No user-supplied user_id, balance, unlock status or publication status is trusted.

### 6.2 Author creates and publishes a chapter
1. Authenticated author creates or edits a draft owned by their principal.
2. Draft autosave uses version/concurrency protection and owner-scoped SQL.
3. Author submits rights declaration and required evidence.
4. Rights workflow assigns an eligible independent reviewer.
5. Publishing workflow validates rights state, author permission, content state and scheduling constraints.
6. Publication transition writes audit and emits ChapterPublished.
7. Catalog/search/sitemap projections update only after publication is committed.
8. Public analytics begin from eligible publication events.

A draft save must not accidentally publish, expose content to search or increment public chapter counts.

### 6.3 Reader purchases tickets and unlocks a chapter
1. Client selects a configured ticket package or submits a payment claim.
2. Server resolves current price and currency from trusted configuration.
3. Payment claim remains pending until verified evidence and authorized approval.
4. Approval is idempotent and independently authorized.
5. Ticket ledger credit and account balance projection update atomically.
6. Unlock operation checks current server price and balance.
7. Debit, ledger entry and unlock entitlement commit atomically.
8. Duplicate/replayed requests cannot double-credit or double-debit.

If any required transaction or ledger write fails, the operation rolls back or remains in a recoverable pending state.

### 6.4 Community report and moderation
1. User submits a report referencing a valid public target.
2. Report is created with reporter ownership and minimal target snapshot.
3. Queue assignment limits which moderators can inspect the case.
4. Moderator checks policy and records a reasoned decision.
5. State transition and audit are committed.
6. Appeals are separate records with independent assignment.
7. Reporter receives only the permitted outcome summary.

A moderator role alone does not grant access to payment, provider credentials, AI prompts or unrelated private messages.

### 6.5 OmniPortal metadata discovery
1. Provider registry lists only approved provider metadata.
2. Connector authorization defines exact permitted capabilities and terms.
3. Fetch job validates host, DNS/IP resolution, redirects, response size and content type.
4. Metadata is stored with source, timestamp, attribution, terms and provenance.
5. Candidate record remains pending editorial/rights review.
6. Only approved metadata may enter catalog suggestion workflows.
7. Chapter text/body import remains disabled without explicit rights authorization.

### 6.6 AI generation
1. User creates an owner-scoped project.
2. Server checks account state, AI permission, provider availability and quota.
3. Prompt is sent to the configured backend provider using server-held credentials.
4. Job records provider/model/version, bounded usage and status.
5. Output is stored under the project owner.
6. Retry/cancel behavior is idempotent and does not duplicate chargeable jobs.
7. Staff access is exceptional and audited; output is not public unless the author explicitly publishes it through the normal rights workflow.

## 7. Cross-domain read models and event boundaries

| Producer | Event / projection | Consumer | Allowed payload |
|---|---|---|---|
| Identity | AccountStateChanged | all domains | user ID, new state, effective time; no password/session secret |
| Catalog/Publishing | NovelPublished / ChapterPublished | search, sitemap, discovery, analytics | public IDs, publication timestamp, approved public metadata |
| Reading | ReadingPositionUpdated | user's own continue-reading projection | owner ID and minimal resource/progress fields; never public feed |
| Community | CommentCreated / ModerationDecisionRecorded | discussion UI, notification service, moderation analytics | public-safe comment data or restricted case ID |
| Commerce | TicketLedgerEntryCreated / ChapterUnlocked | account wallet, entitlement check, receipt UI | owner-scoped transaction reference and amounts |
| Rights | RightsDecisionRecorded | publishing workflow, catalog eligibility | work ID, decision, scope, reviewer audit reference |
| OmniPortal | MetadataImportCompleted | Trend Factory, editorial queue | source-attributed metadata and terms status |
| AI Studio | AIGenerationCompleted | owner project view, usage accounting | project owner, job ID, output reference and usage |
| Operations | AgentRunCompleted / SecurityIncidentOpened | scoped admin dashboards and alerting | minimized status, severity and audit reference |

Events must not become a side channel for private data. Subscribers must authorize independently before returning any user-specific projection.

## 8. Transaction and consistency requirements

Strong transactional consistency is required for:
- ticket ledger credit/debit and unlock entitlement;
- payment approval/rejection state transitions;
- publication state changes and rights decision linkage;
- role/grant assignment and audit event;
- moderation state transitions and audit event;
- one-time/idempotent webhook processing.

Eventual consistency is acceptable for:
- search index refresh;
- aggregate view/like counters;
- trending/ranking snapshots;
- recommendation shelves;
- analytics dashboards;
- provider metadata discovery status.

Every eventual projection shows a freshness timestamp or a clear unavailable state where users could otherwise infer instant updates.

## 9. Retention, deletion and export

Define policy per entity before implementation:
- User export includes only the requesting user's accessible records and excludes other participants' private data and restricted internal security notes.
- Account deletion may require anonymization or retention of legally required financial/audit records.
- Financial ledger history is retained under applicable obligations and corrected through compensating entries, not deletion.
- Moderation and safety records use a documented retention schedule and limited staff access.
- Provider provenance and rights evidence are retained according to license and dispute requirements.
- AI prompts and outputs need explicit retention and deletion behavior.
- Backups follow a bounded expiry cycle; deletion from primary tables does not imply immediate removal from immutable backups.
- Legal holds and appeals suspend ordinary deletion only for documented records and periods.

## 10. Required verification artifacts

Before declaring the map implemented, produce:
1. Complete table/column/index/trigger inventory from the exact release baseline.
2. For each table, owning domain, owner key, sensitivity, retention and migration history.
3. SQL query inventory for every read/write path.
4. Route/API-to-table matrix with permission and ownership predicates.
5. Event producer/consumer catalogue and payload schemas.
6. Cross-user test suite for reads, writes, deletes, exports, jobs, caches and subscriptions.
7. Transaction/concurrency tests for financial and publishing state transitions.
8. Clean-install and supported-upgrade migration test evidence.
9. Data export/deletion fixtures proving no cross-user leakage.
10. Staff access audit tests proving purpose and assignment constraints.

## 11. Exit criteria

This artifact is reviewed only when every existing physical table is mapped to one owner domain, every user-private table has an owner predicate, every cross-domain flow has an explicit contract, every sensitive event has a minimized payload, every high-risk mutation has transaction/idempotency/audit rules, and the implementation mapping is verified against both source and disposable test databases.

**No production schema, data, secrets or deployment are changed by this document.**
