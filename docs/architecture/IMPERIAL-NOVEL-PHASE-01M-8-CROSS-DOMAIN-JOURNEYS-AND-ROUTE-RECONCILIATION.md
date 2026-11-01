# Imperial Novel | Phase 01M.8: Cross-Domain Journeys & Route Reconciliation

**Brand:** Read • Create • Conquer  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture integration review; documentation only.

## 1. Purpose

The preceding 01M blueprints define screen families by domain. This document connects them into complete user journeys and sets the route/API reconciliation gates required before implementation. It is the integration layer between the screen catalogue and the next engineering phases.

## 2. Primary product journeys

### JRN-001 Discover → evaluate → read
Home/discovery → search or taxonomy → novel detail → chapter list → reader → next/previous chapter → bookmark/history/progress → review/follow/recommendation.

Rules:
- A discovery card links to one canonical novel URL.
- Detail page clearly identifies language, format, status, author, content notices, rights/publisher attribution where relevant and chapter availability.
- Reader validates publication and rights state before serving content.
- Reading position is saved only for the authenticated owner and valid published chapter.
- Ratings are whole numbers from 1 to 10. Rating count and average are real aggregates, never sample placeholders.
- Reader theme and typography preferences persist without resetting chapter position.

### JRN-002 Reader → Crown Vault → unlock
Reader locked chapter → visible cost → Crown balance → purchase/ledger history → approved checkout → payment verification → ledger credit → return to intended chapter → unlock.

Rules:
- Preserve intended chapter in a safe return reference.
- Recalculate amount and entitlement server-side.
- A payment pending state cannot unlock content.
- A completed entitlement cannot be charged twice.
- If payment is delayed, reader can leave and return without losing order state.

### JRN-003 Reader → community
Novel detail/reader → review or discussion → report/block controls → notification → moderation decision → appeal/support.

Rules:
- Review rating is an integer 1–10, separate from comments and reactions.
- Reporters' identity is protected from the reported party.
- Block controls affect discovery, messaging and notifications consistently.
- Moderation does not disclose private staff notes.

### JRN-004 Reader → author
Reader profile → become-an-author → application → pending status → reviewer decision → Author Studio → story draft → chapter draft → rights/quality review → publication → author analytics.

Rules:
- Approval changes role only after the review decision is committed.
- Drafts remain private to owner and permitted collaborators.
- AI-generated content remains a draft until author review and ordinary publishing checks.
- Author analytics distinguish views/requests from unique readers and actual earnings.

### JRN-005 Author → community → audience
Author profile/story → follow → update notification → reader returns → chapter read → review/comment → author sees permitted aggregate engagement.

Rules:
- Do not expose individual private reading history to authors.
- Notification delivery is recoverable from persisted records.
- Follow and engagement counts use server-side deduplication and disclose freshness.

### JRN-006 OmniPortal source → rights → import
Provider directory → provider detail → authorization request → rights review → provider enablement → metadata search → duplicate review → import request → approval → metadata import → provenance QA.

Rules:
- Directory listing is not authorization.
- Rights scope is endpoint/field/purpose-specific.
- Chapter body import remains disabled unless a separate explicit license grants it.
- Revocation blocks queued work and triggers impact review.

### JRN-007 Trend observation → editorial insight
Approved source → scheduled collection → observation with provenance → deduplication → trend derivation → confidence assessment → editorial review → approval → publication/report.

Rules:
- Raw observations and derived scores are distinct.
- Every published insight has evidence, window, method and freshness.
- Weak or stale signals cannot be promoted as current trends.
- No autonomous publication.

### JRN-008 Payment → support/dispute
Order → payment attempt → pending/verified/rejected → Crown credit or recovery → receipt → support case/refund request → finance decision → provider reconciliation.

Rules:
- Payment verification and ledger credit are distinct transitions.
- Refunds are compensating transactions.
- Support cannot issue a credit or refund outside assigned permission.

### JRN-009 Account privacy and security
Account settings → security/session review → privacy choices → export request or deletion request → reauthentication → processing → audit/status → confirmation.

Rules:
- User-owned private resources remain owner-scoped.
- Account deletion handles authored works, public contributions, financial/audit retention and legal obligations explicitly.
- Session revocation and account deletion invalidate active sessions.

## 3. Shared journey state contract

Every cross-domain operation should identify:
- actor and effective permission;
- resource owner and visibility;
- current state and allowed next states;
- idempotency key where retries may duplicate work;
- correlation ID across UI/API/job/notification;
- created/updated timestamps;
- data provenance and freshness where external data is involved;
- user-safe error code and recovery action;
- audit event for consequential transitions.

A UI must not infer success from a button click. It waits for the authoritative server response and renders the persisted state. Long-running work uses a durable job/resource ID so a refresh or device change can recover status.

## 4. Shell assignment

| Shell | Domains | Global elements |
|---|---|---|
| Public shell | Home, discovery, taxonomy, novel/author public pages, help, legal | Header, search, footer, language, theme |
| Reader shell | Chapter reader, reader settings, chapter navigation | Reading toolbar, progress, accessible controls |
| Account shell | Profile, security, preferences, privacy, library | Account navigation, session state |
| Creator shell | Author Studio, drafts, editor, analytics | Creator navigation, autosave/recovery state |
| Community shell | Feed, discussions, reviews, groups, messages | Community navigation, report/block controls |
| Commerce shell | Crown Vault, checkout, ledger, receipts | Order state, support link |
| OmniPortal shell | Provider directory, search, rights, jobs | Provider capability and rights indicators |
| Trend shell | Sources, observations, trends, reports, review | Provenance/freshness and editorial state |
| Admin shell | Finance, publishing, moderation, security, agents, audit | Role-aware admin navigation, incident indicator |
| System shell | Error, maintenance, access denied, expired session | Recovery path and status information |

Do not render admin navigation to users without the relevant permission. A shell is a visual composition, never a security boundary.

## 5. Canonical route and compatibility policy

Current client routes observed in the repository include:
- `/`, `/catalog`, `/catalog?sort=trending`, `/leaderboard`, `/library`, `/community`, `/become-an-author`, `/author`, `/trend-factory`, `/genres`, `/formats`, `/format/:format`, `/tickets`, `/omniportal`, `/account`, `/search`, `/notifications`.
- Novel detail links use `/novel/:id`; reader links use `/read/:novelId/:chapterNumber`.

Rules for route evolution:
1. Preserve current working routes until replacements are implemented and tested.
2. Maintain a single route registry with route ID, canonical path, aliases, shell, auth, permission, SEO policy and owning domain.
3. Redirect only after verifying query parameters, deep links, bookmarks and search-engine canonical behavior.
4. Unknown and malformed IDs return a proper 404, not an empty shell.
5. Auth-required routes preserve a safe same-origin return destination.
6. Private routes are noindex and protected server-side.
7. Do not create multiple canonical URLs for the same content.
8. Keep route ownership explicit to avoid conflicting pathname handlers.

## 6. Cross-domain event contract

Events are durable business facts, not UI notifications. Proposed event names:
- `account.registered`, `account.email_verified`, `account.security_changed`, `account.deletion_requested`
- `library.bookmarked`, `reading.position_updated`, `reading.chapter_completed`
- `community.review_created`, `community.report_created`, `community.moderation_decided`
- `author.application_submitted`, `author.application_decided`, `publishing.submitted`, `publishing.approved`
- `commerce.order_created`, `commerce.payment_verified`, `commerce.crown_credited`, `commerce.refund_completed`
- `omni.rights_authorized`, `omni.rights_revoked`, `omni.import_reviewed`, `omni.import_completed`
- `trend.observation_collected`, `trend.record_derived`, `trend.editorial_approved`, `trend.published`
- `security.alert_created`, `security.incident_opened`, `security.incident_resolved`

Each event includes unique event ID, aggregate ID, actor/system identity, schema version, occurrence time, correlation ID and minimal payload. Consumers must be idempotent. Notifications, analytics and agents consume durable events; they do not become the source of truth.

## 7. Cross-domain failure and recovery rules

- **Session expiry:** preserve safe draft/form state locally only where privacy permits; redirect to login with a validated same-origin return route.
- **Network loss:** display offline state, queue only explicitly safe idempotent operations, and never queue payment confirmation or privileged decisions in browser storage.
- **Stale data:** show last update and stale state; do not substitute zero or fabricated freshness.
- **Partial success:** identify exactly which operation succeeded and which remains pending; provide retry only for idempotent steps.
- **Permission change:** re-check authorization on every request and refresh affected UI state.
- **Rights revocation:** stop new imports and scheduled publication using affected evidence; open review tasks for existing material.
- **Payment uncertainty:** preserve order and wait for authoritative reconciliation; never issue duplicate credit.
- **Agent failure:** preserve input references and safe diagnostics; manual human workflow remains available.
- **D1/Worker failure:** user-facing actions fail safely; no optimistic irreversible state change.

## 8. End-to-end acceptance suite

- A reader can discover, open and resume a permitted novel on mobile without losing progress.
- A locked chapter cannot be unlocked by a pending payment or forged browser return.
- A Crown purchase can be retried safely after network loss without duplicate charge or credit.
- A review, report, block and moderation decision preserve privacy and audit.
- An author can create and recover drafts without AI configuration.
- Rights revocation blocks new OmniPortal imports and creates a review record.
- Trend reports reproduce their evidence window and methodology version.
- A private account resource cannot be read by changing an ID in the URL.
- Language switching preserves route and form state; RTL works through the reader and checkout.
- Admin permission changes immediately affect protected actions.
- Every user-visible real-time label is backed by an observed timestamp and actual update mechanism.
- Each domain supports loading, empty, stale, error, forbidden and recovery states.

## 9. Architecture exit checklist

- [ ] All 01M screen blueprints are linked from the master index.
- [ ] Route registry is reconciled against actual client router and Worker HTML route map.
- [ ] Every existing API is classified as observed, proposed, deprecated or production-unverified.
- [ ] RBAC/ABAC permission map is reconciled with current coarse admin/author/user checks.
- [ ] Actual historical D1 migrations are inspected before schema implementation.
- [ ] All cross-domain state machines have owners, allowed transitions and recovery rules.
- [ ] Every real-time claim identifies request-time, polling, scheduled or push behavior.
- [ ] Public/private/noindex rules are reviewed for every route.
- [ ] Rights, payment, privacy and moderation legal review gates are assigned.
- [ ] Mobile, accessibility, performance, security and recovery test plans are measurable.
- [ ] Implementation sequence and release gates are approved before code changes.

## 10. Status

Phase 01M.8 cross-domain journeys and route reconciliation policy are specified. This does not mean all screen architecture or prior master phases have passed final review. The next architecture activity is a consolidated route/API/permission/schema evidence audit, followed by an architecture decision record for unresolved conflicts. No application code, D1 data, migration, production setting, secret or deployment was changed.
