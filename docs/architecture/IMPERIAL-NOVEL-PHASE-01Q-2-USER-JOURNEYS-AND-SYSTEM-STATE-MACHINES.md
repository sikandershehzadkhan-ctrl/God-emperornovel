# Imperial Novel | Phase 01Q.2: User Journeys & System State Machines

**Parent:** Phase 01Q Complete Platform Reference Architecture  
**Related:** Phase 01Q.1 Domain Data Ownership & Flow Map; Phase 01P authorization architecture  
**Status:** Target workflow contract. It is not evidence that all journeys or transitions exist in the current application.

## 1. Purpose and modeling rules

This artifact defines the end-to-end user journeys and the allowed state transitions for the platform's highest-risk and highest-value workflows.

Every workflow must identify:
- initiating actor and authenticated principal;
- preconditions and authorization;
- resource owner and visibility;
- accepted command and validated input;
- current state and allowed next states;
- transaction boundary and idempotency key;
- emitted event and audit record;
- user-visible success, pending, failure and recovery states;
- notification policy and data disclosure;
- abuse, concurrency and cross-user test cases.

A UI action is a request, not proof that a transition occurred. The server validates and commits the transition before the client displays success. Invalid transitions fail closed and do not partially mutate related records.

## 2. Global state and transition conventions

### 2.1 State dimensions remain separate

Do not overload one status field to represent unrelated concerns.

- **Account state:** email_unverified, active, restricted, suspended, banned, deletion_pending, deleted/anonymized.
- **Role assignment:** user, author or a separately granted staff capability. Roles are not account states.
- **Resource lifecycle:** draft, submitted, under_review, approved, scheduled, published, rejected, archived, removed, where applicable.
- **Payment lifecycle:** initiated, pending_verification, approved, rejected, cancelled, expired, reversed.
- **Job lifecycle:** queued, running, succeeded, failed, retry_wait, cancelled, dead_letter.
- **Moderation lifecycle:** open, triaged, investigating, actioned, appealed, appeal_review, closed.
- **Connector lifecycle:** disabled, requested, under_review, approved, enabled, paused, revoked, failed.
- **AI generation lifecycle:** queued, running, succeeded, failed, cancelled, blocked, expired.

A transition in one dimension does not implicitly grant a role, publish content, approve money or enable a connector.

### 2.2 Transition envelope

Every command that changes state carries:
- command ID / idempotency key;
- authenticated actor or trusted service identity;
- target resource ID;
- expected current state or version;
- validated command-specific payload;
- request correlation ID.

The server derives actor and owner identity from trusted session/service context. It records actor, resource, prior state, new state, reason code, timestamp and correlation reference. Sensitive payloads are minimized in audit records.

### 2.3 Common failure handling

- 401: no valid authenticated principal where authentication is required.
- 403: authenticated principal lacks permission or account state disallows action.
- 404: resource absent or deliberately concealed because caller is not allowed to know it exists.
- 409: state/version conflict, duplicate transition or concurrency conflict.
- 422: validly parsed request violates domain rules.
- 429: rate/abuse limit.
- 5xx: transient or internal failure; no false success message.

Clients may retry only when the operation is idempotent or carries a valid idempotency key. Non-idempotent retries must not duplicate payments, ledger entries, publication events or AI charges.

## 3. Journey A: visitor to registered reader

### Actors
Anonymous visitor; registering user; identity service; notification/email provider.

### Journey
1. Visitor opens a public route.
2. Visitor chooses registration and submits validated credentials and required consent.
3. Server applies abuse/rate checks, creates account in email_unverified state and issues a verification challenge.
4. Verification challenge is delivered through a configured provider. Delivery failure is visible and retryable under rate limits.
5. User verifies challenge. Server validates expiry, single-use token and account state, then activates the account.
6. User signs in. Server creates a rotated session and sets secure cookie attributes.
7. User completes optional profile preferences and locale settings.
8. User can browse public content and create private library/progress records.

### State transitions
- Registration: not_started → verification_pending → active.
- Verification: pending → consumed; expired/revoked challenges cannot be reused.
- Session: absent → active → rotated / revoked / expired.

### Security and privacy
- Never disclose whether an email is registered through a public recovery/registration oracle.
- Passwords are hashed using a current approved password-hashing configuration; plaintext is never logged.
- Verification tokens are random, hashed at rest where feasible, single-use and time-limited.
- Session IDs rotate after authentication and privilege changes.
- User A cannot enumerate or alter User B's profile, sessions or verification state.

### Recovery
Resend verification is rate-limited. Expired challenges can be replaced. A user who loses a session can authenticate again; old sessions can be revoked. Account recovery must not rely solely on a publicly guessable identifier.

## 4. Journey B: reader to author

### Actors
Active reader; author application reviewer; identity/access service.

### Journey
1. Active user opens the author application.
2. Server checks account state and application eligibility.
3. User submits required application details and declarations.
4. Application is created as submitted and assigned to an eligible reviewer.
5. Reviewer may request information, approve or reject with a reason code.
6. On approval, the system grants the author capability through a controlled role/permission assignment.
7. User receives a decision notification and Author Studio access.
8. Revocation or suspension of author capability does not delete ownership of existing works or bypass appeal/retention policy.

### State machine
- Application: draft → submitted → under_review → approved | rejected | information_requested.
- information_requested → resubmitted → under_review.
- approved is terminal for that application version; a new application or appeal path handles later changes.
- Author capability: absent → active → suspended/revoked; restoration requires an authorized decision.

### Controls
- Applicant cannot approve their own application.
- Reviewer must have scoped review permission.
- Approval records reviewer, policy version and reason.
- Role assignment is not a client-editable profile field.
- A user cannot promote themselves by modifying API payloads or local storage.

## 5. Journey C: author creates, reviews and publishes a novel/chapter

### Actors
Author/owner; rights reviewer; editor/publishing manager; catalog/search projection services.

### Journey
1. Author creates a novel draft. Server sets owner from session.
2. Author edits metadata and chapters with version checks and autosave.
3. Author submits rights/provenance declaration and required evidence.
4. Author submits work or chapter for review.
5. Rights reviewer validates declared rights and evidence.
6. Editorial/publishing reviewer checks platform policy and required content quality gates.
7. Authorized publisher approves, rejects or requests changes.
8. Author may revise and resubmit. Each submission is versioned.
9. Author may schedule an approved release if policy permits.
10. At the scheduled time, a trusted job rechecks eligibility, approval, rights validity and resource version.
11. Publication transaction updates authoritative state and writes audit/outbox event.
12. Public catalog, search, sitemap and analytics projections update asynchronously.
13. Later unpublish/archive/removal follows a separately authorized workflow and preserves required audit evidence.

### Novel/chapter state machine
- draft → submitted → under_review.
- under_review → changes_requested | approved | rejected.
- changes_requested → draft → submitted.
- approved → scheduled | published.
- scheduled → published | cancelled | changes_requested if an approved edit invalidates the release.
- published → archived | unpublished | removed, each with explicit permission, reason and audit.
- rejected does not silently become approved; resubmission creates a new review cycle/version.

### Rights state machine
- undeclared → declared → evidence_pending → under_review → cleared | denied | more_information_required.
- more_information_required → evidence_pending.
- cleared may be scoped by territory, language, format, duration and distribution channel.
- expired, disputed or revoked rights move to restricted review and may block future publication.
- Publication must check rights scope at the time of release, not only at initial approval.

### Invariants
- Owner ID is server-derived and immutable through ordinary edit APIs.
- A reviewer cannot review a resource outside assigned scope.
- No self-approval where independent review is required.
- A draft is never indexed or included in public counts.
- Publishing and public projection events are committed through an outbox pattern or equivalent reliable mechanism.
- Scheduled jobs revalidate current state; a stale schedule cannot publish a changed or revoked work.
- Content edits after approval invalidate the relevant approval according to policy.

## 6. Journey D: reader discovers, reads and resumes a chapter

### Actors
Anonymous visitor or authenticated reader; catalog; entitlement service; reading service; analytics.

### Journey
1. User discovers a public novel through home, search, category, ranking or recommendation.
2. Catalog returns only published, rights-eligible public metadata.
3. User opens novel detail and selects an available chapter.
4. Entitlement service checks whether the chapter is free, already unlocked or requires purchase.
5. If accessible, reader receives chapter content and reader preferences.
6. Authenticated reader progress is saved under their own principal; anonymous progress may remain local and is not merged without consent.
7. On return, server returns only the user's own last position and library state.
8. View analytics are recorded according to deduplication and bot-filtering rules.

### Reading state
- Position: absent → active → completed; later reading may return completed to active if product policy supports rereading.
- Bookmark: absent ↔ saved.
- Follow: absent ↔ active; unfollow is a state change, not deletion of another user's content.
- Entitlement: not_required | locked → pending_unlock → unlocked; revoked/refunded entitlement requires a policy-defined state and cannot be inferred from client state.

### Controls
- A reader cannot submit another user's owner ID to fetch their progress.
- Chapter content is checked for publication/rights and entitlement on every protected retrieval.
- Cached/offline content is bounded by entitlement, expiry and rights policy.
- Private progress responses are not placed in shared public caches.

## 7. Journey E: ticket purchase, payment verification and chapter unlock

### Actors
Reader; commerce service; finance operator; independent finance approver; payment provider when approved.

### Journey
1. Reader chooses a configured ticket package or starts a permitted payment method.
2. Server loads current product price, currency and availability.
3. Server creates an order/payment claim with a unique reference and pending state.
4. User completes the external payment process if a verified integration exists, or submits permitted proof under a documented manual process.
5. Payment callback/evidence is verified independently of the client success screen.
6. Finance operator reviews evidence and records a decision recommendation.
7. A separate authorized approver confirms high-risk/manual credit where required.
8. Approval transaction marks payment approved and appends a credit ledger entry exactly once.
9. Reader sees confirmed wallet balance after commit.
10. Reader requests a chapter unlock.
11. Server checks chapter price, entitlement, balance and account state.
12. One transaction debits ledger and creates entitlement.
13. Receipt/notification is emitted after commit.
14. Refund/reversal creates compensating ledger entries and updates entitlement according to published policy.

### Payment state machine
- initiated → pending_verification.
- pending_verification → approved | rejected | expired | cancelled.
- approved → reversed only through an authorized reversal workflow.
- rejected may be resubmitted only through a new claim or explicit appeal path.
- A duplicate callback or repeated approval request returns the original outcome and never creates a second credit.

### Unlock state machine
- locked → unlocked after successful atomic debit + entitlement creation.
- unlocked → revoked only through a policy-defined refund, fraud or rights action with audit.
- Existing unlock is idempotent; repeated request does not debit again.

### Financial invariants
- Amount and currency are server-calculated.
- Ledger entries are immutable.
- Balance is derived from ledger or a transactionally maintained projection that can be reconciled.
- No staff member can approve their own claim.
- Payment provider callbacks are signature-verified, replay-protected and idempotent.
- Manual proof is not treated as verified payment until an authorized decision.
- If the ledger write fails, payment approval and wallet credit do not partially commit.

## 8. Journey F: community participation and moderation

### Actors
Reader; author; reporter; assigned moderator; appeal reviewer.

### Journey
1. Active user creates comment/reaction/review against an eligible public resource.
2. Server validates ownership of the actor identity, content rules, rate limits and target visibility.
3. Public-safe content is displayed; private metadata remains hidden.
4. User reports content or account with a reason and optional evidence.
5. Report enters open queue and is assigned by queue scope.
6. Moderator investigates using minimum necessary context.
7. Moderator records no-action, warning, hide/remove, restriction or escalation decision.
8. User receives only policy-permitted notice.
9. Affected user may appeal within the allowed window.
10. Independent appeal reviewer records uphold, modify or overturn decision.
11. Case closes and retention policy applies.

### Report/case state machine
- open → triaged → investigating → actioned | no_action | escalated.
- actioned/no_action → appealed → appeal_review → upheld | modified | overturned.
- final outcome → closed.
- Reopening requires explicit reason and permission.

### Controls
- Moderator scope is limited to assigned queues and resource types.
- Reporter identity, private notes and evidence are not exposed to reported user.
- A moderator cannot access unrelated private messages or finance records.
- Appeals are independently assigned where practicable.
- Rate limits and duplicate-report handling prevent harassment and queue flooding.

## 9. Journey G: OmniPortal provider onboarding and metadata discovery

### Actors
Provider operator; rights reviewer; system fetch job; editorial reviewer.

### Journey
1. Operator proposes provider and documents source, terms, rights and intended metadata fields.
2. Connector request is created disabled.
3. Rights/legal review determines permitted capabilities, attribution, territory, storage and refresh rules.
4. Security review validates endpoints, authentication method, redirect policy and SSRF controls.
5. Independent approver authorizes exact scopes.
6. Connector is enabled only for approved capabilities.
7. Scheduled metadata job fetches bounded content and records provenance.
8. Trend Factory receives eligible metadata observations.
9. Editorial reviewer decides whether a candidate may be used for an Imperial Novel catalog workflow.
10. Provider health failures pause fetches; revoked terms or rights disable affected capability.
11. Audit and provenance remain available to authorized reviewers.

### Connector state machine
- disabled → requested → under_review → approved → enabled.
- under_review → rejected.
- enabled → paused → enabled after revalidation.
- enabled/paused → revoked.
- failed health state may pause jobs but does not silently broaden permissions.

### Controls
- Provider availability is not a license.
- No chapter body ingestion without explicit rights.
- Credentials are stored as secret references and never returned to clients.
- Fetcher validates DNS/IP, redirects, response size/type, timeout and allowed hosts.
- Connector operator cannot approve own request.
- Each job rechecks connector status and scope before execution.

## 10. Journey H: AI Author Studio generation

### Actors
Author/user; AI service; configured provider; moderation/policy service.

### Journey
1. User creates a private AI project owned by their principal.
2. User submits a generation request with project ID and bounded parameters.
3. Server verifies owner, account state, feature availability, provider health, policy and quota.
4. Server creates idempotent job and records model/provider configuration.
5. Worker sends request using server-held credentials.
6. Output is checked against configured safety and product policies.
7. Output is saved to the same owner-scoped project.
8. User reviews, edits or discards output.
9. If user chooses publication, content goes through ordinary rights and publishing workflow.
10. Usage and cost are reconciled; failure/refund policy is applied transparently.

### Generation state machine
- queued → running → succeeded | failed | blocked | cancelled.
- failed → retry_wait → queued only for retryable failures and within retry/cost limit.
- running → cancelled only where provider/job semantics support cancellation.
- succeeded output is immutable as a generation record; edits create a separate user-authored revision.
- expired projects follow owner deletion/retention policy.

### Controls
- Project owner is server-derived.
- A user cannot read, cancel, retry or export another user's generation.
- Provider/model are explicit and configured; no hidden fallback.
- Prompt/output are not sent to analytics or logs by default.
- Cost ceilings, rate limits and concurrency limits are enforced server-side.
- AI output does not inherit publishing rights or factual authority.

## 11. Journey I: account restriction, suspension, deletion and recovery

### Actors
Account owner; identity service; support/security staff; privacy/deletion workflow.

### Account state machine
- email_unverified → active after valid verification.
- active → restricted for scoped feature limits.
- active/restricted → suspended for temporary access block.
- active/restricted/suspended → banned under authorized policy.
- active/restricted/suspended → deletion_pending on verified request.
- deletion_pending → deleted/anonymized after retention/legal-hold checks.
- suspended/restricted may return to active after authorized review.
- banned restoration requires explicit appeal/reversal authority; no self-service role escalation.

### Journey
1. User requests account recovery, restriction review or deletion.
2. Server verifies identity and request authenticity.
3. Support/security workflow assigns scoped reviewer.
4. Account state is changed only by authorized action with reason and expiry where applicable.
5. Restricted/suspended sessions are revoked or constrained according to policy.
6. Deletion workflow inventories owned data, shared content, financial records, safety records and legal holds.
7. User is informed of what will be deleted, anonymized or retained and why.
8. Deletion/anonymization job runs idempotently and records completion evidence.
9. Backups expire under documented schedule; legal holds suspend only affected records.
10. Recovery is available only where policy and retention state permit it.

### Controls
- Account state is distinct from role.
- Banned/restricted accounts cannot continue sensitive writes using stale sessions.
- Deletion does not erase financial audit obligations or other users' lawful records.
- User exports exclude other participants' private data and restricted internal notes.
- Staff cannot browse all user data merely because they handle a ticket.

## 12. Journey J: staff permission request and emergency access

### Actors
Staff requester; approver; security administrator; audit service.

### Normal access journey
1. Staff member requests a named permission for a defined resource scope and business purpose.
2. System validates training/eligibility and separation-of-duties constraints.
3. Independent approver grants or rejects the request.
4. Grant records permission, scope, purpose, approver, expiry and review date.
5. Every use is checked against the grant and audited.
6. Expired/revoked grants cease working immediately or at defined short cache expiry.
7. Periodic access review confirms continued need.

### Emergency access journey
1. Incident is declared with incident ID and reason.
2. Eligible security authority requests temporary elevated access.
3. Independent approval is required where feasible; break-glass exception is narrowly defined.
4. Grant is time-limited, highly visible and automatically expires.
5. All access is logged and reviewed after incident.
6. Emergency access cannot disable audit or permanently assign itself.

### State machine
- requested → approved | rejected.
- approved → active → expired | revoked.
- emergency grant: declared → approved/exception-authorized → active → expired → reviewed.
- A grant never silently renews.

## 13. Journey K: Trend Factory editorial pipeline

### Actors
Scheduled discovery job; Trend Factory analyst; editor; rights reviewer; catalog team.

### Journey
1. Approved source list is read.
2. Discovery job retrieves bounded metadata and source timestamps.
3. Normalization and duplicate detection produce candidate observations.
4. Trend scoring uses documented signals, windows and minimum thresholds.
5. Analyst reviews evidence, freshness, source terms and confidence.
6. Editor accepts, rejects, merges or defers a candidate.
7. Rights reviewer verifies any proposed reuse beyond metadata.
8. Approved candidate may create a catalog suggestion, never an automatic unauthorized publication.
9. Source failure, terms change or stale data marks candidate accordingly.

### Candidate state machine
- observed → normalized → scored → review_pending.
- review_pending → accepted | rejected | duplicate | deferred.
- accepted → catalog_proposal.
- catalog_proposal → rights_review → approved_for_workflow | blocked.
- A candidate is not a published novel and cannot bypass author rights declarations.

## 14. Journey L: real-time updates and notifications

### Actors
Domain producer; event/outbox dispatcher; notification service; recipient client.

### Journey
1. Domain transaction commits state and outbox event atomically.
2. Dispatcher claims event with lease/idempotency.
3. Consumer validates schema and recipient scope.
4. Notification is created only for eligible recipient(s).
5. Client receives update through verified push transport or bounded polling.
6. Client fetches authoritative state using its own authorization.
7. Delivery failure retries with backoff; poison events move to dead-letter review.

### Event/job state
- pending → claimed → delivered.
- claimed → retry_wait → claimed.
- terminal: dead_letter or cancelled by authorized operator.
- Duplicate delivery is safe; notification identity is unique per event/recipient/type.

No private message body, AI prompt or payment evidence is broadcast to unauthorized subscribers. Push payloads contain minimal opaque references; client must fetch authorized detail.

## 15. Concurrency, retry and compensation catalogue

| Operation | Concurrency control | Idempotency | Compensation |
|---|---|---|---|
| Draft autosave | version/ETag compare | request ID | restore prior revision |
| Publish | expected state/version + transaction | publication command ID | unpublish/withdraw workflow |
| Payment approval | unique provider/reference + transaction | payment claim ID | reversal ledger entry |
| Ticket unlock | transaction + unique entitlement | user/chapter request key | refund/revoke policy |
| Comment create | client command ID + rate limit | command ID | moderation removal, not silent erasure |
| AI generation | owner/project + quota + job lock | generation request ID | usage adjustment per provider policy |
| Metadata import | provider/job cursor + lease | provider/source/item key | mark stale or retract projection |
| Staff grant | unique grant + expiry | request ID | revoke and audit |

Retries must use bounded exponential backoff with jitter where appropriate. Never retry permanent validation, authorization or rights failures automatically.

## 16. Acceptance and security test matrix

Minimum tests for every journey:
- anonymous request to protected operation is denied;
- User A cannot read/update/delete/export User B's private resource;
- forged owner ID, role, price, balance, status or reviewer ID is ignored/rejected;
- stale session and revoked grant are denied;
- account restrictions block prohibited operations;
- unassigned staff cannot inspect resource/case;
- invalid state transition returns conflict and causes no partial mutation;
- duplicate command/event/webhook does not duplicate side effects;
- concurrent requests cannot overspend, double approve or double publish;
- failure between transaction steps leaves a recoverable consistent state;
- private content never appears in public search, sitemap, analytics or shared cache;
- audit record exists for every sensitive transition;
- notification recipient and payload are correctly scoped;
- deletion/export does not leak other users' records.

Test data must be synthetic and isolated from production D1 and secrets.

## 17. Journey completion checklist

A journey is implementation-ready only when:
- actors and permissions are mapped to the API contract;
- each state and transition has a server-side guard;
- resource owner and staff scope are explicit;
- database constraints and transaction boundaries are defined;
- idempotency, concurrency and compensation are specified;
- audit/event payloads are minimized;
- user-visible outcomes and recovery are designed;
- tests cover negative, abuse, concurrency and cross-user cases;
- operational alerts and runbooks exist for high-risk failures.

## 18. Open policy decisions

The following require explicit product/legal/operational decisions before implementation:
1. Exact identity verification and account recovery methods.
2. Author application eligibility and appeal process.
3. Rights evidence standards, reviewer qualifications and territory/language scopes.
4. Moderation policy, enforcement ladder, appeal windows and retention.
5. Payment evidence requirements, approval thresholds, refunds and chargeback handling.
6. Ticket expiry, transferability and refund rules.
7. Account deletion grace period, financial retention and legal-hold procedure.
8. AI provider, permitted use cases, data retention and cost ceilings.
9. Provider onboarding criteria, allowed metadata fields and refresh cadence.
10. Notification preferences, presence visibility and real-time freshness targets.

**No production data, schema, secrets or deployment are changed by this document.**
