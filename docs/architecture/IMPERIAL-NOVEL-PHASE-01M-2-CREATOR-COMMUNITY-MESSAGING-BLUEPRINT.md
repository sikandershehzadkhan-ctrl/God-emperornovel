# Imperial Novel — Phase 01M.2 Creator, Community and Communication Screen Blueprint

**Product:** Imperial Novel  
**Brand:** Read • Create • Conquer  
**Workstream:** Master architecture, Phase 01M  
**Branch:** `architecture/phase-01m-screen-blueprint`  
**Status:** Architecture specification in progress. No application code, production data, database migrations, or deployment changed by this document.

## 1. Architecture objective

Specify the creator, author-onboarding, community, messaging, and notification experiences as connected product journeys. Preserve existing production routes and API behavior until the actual router and Worker handlers have been reconciled. Proposed endpoints below are logical contracts, not claims that those endpoints already exist.

## 2. Creator experience principles

1. A creator owns their drafts and can see only work they own or are explicitly assigned to collaborate on.
2. A new story starts private. Submission, approval, scheduling, and publication are distinct states.
3. Publishing requires rights eligibility, content-policy checks, and the correct server-side permission.
4. Autosave must expose saved/unsaved state, last successful save, retry, and conflict recovery. Never silently discard text.
5. Chapter revisions are preserved; edits to published chapters do not silently rewrite the reader's historical experience.
6. Analytics distinguish lifetime counters, period counters, unique accounts, request counts, ticket spend, and actual creator earnings.
7. AI-generated output is always a draft until the author reviews and explicitly saves/submits it. AI must never auto-publish.
8. The UI must not imply that a provider, AI model, payout rail, or integration is operational unless server capability/configuration confirms it.

## 3. Public author onboarding

### CRT-PUB-001 — Become an author
**Existing observed route:** `/become-an-author` (public production returned a not-found response during the read-only baseline check; feature-branch client contains an author application experience).  
**Purpose:** Explain eligibility and invite readers to apply for creator access.  
**Audience:** Signed-out visitors and signed-in readers without author role.  
**Shell:** Public.

**Screen sections:**
- Author program introduction and benefits, with no unverified earnings promises.
- Content eligibility and rights policy summary.
- Supported content formats and language information.
- Clear application steps and review expectations.
- FAQ and links to author guidelines, copyright policy, privacy, and support.
- Primary action: Apply / Continue application.

**Signed-out behavior:** CTA routes to registration/login, then returns to the onboarding flow without losing intended destination.  
**Signed-in reader behavior:** CTA opens the application form or resumes the user's existing application.  
**Author/admin behavior:** Show a clear link to Creator Studio instead of an application form.

### CRT-PUB-002 — Author application
**Logical route:** retain current application route if present; final route name must be verified against the router before canonicalization.  
**Observed API contract:** client submits `POST /api/author/applications` with display name, bio, experience, portfolio URL, sample work, one to five preferred formats, and rights confirmation. The client checks application status and displays approved/rejected/pending feedback.

**Form fields:**
- Display name.
- Short creator biography.
- Writing/creation experience.
- Optional portfolio URL, validated as a safe HTTPS URL.
- Sample work or representative link/text.
- One to five preferred formats.
- Explicit rights and policy confirmation.

**States:** not submitted, submitted/pending, approved, rejected with review notes, retryable error, account not eligible, session expired. Do not allow duplicate active applications unless the policy explicitly permits resubmission.

**Security:** server derives applicant identity from the authenticated session; ignore client-supplied user IDs or roles. Validate URL scheme, length, formats, text limits, rate limits, and rights confirmation server-side.

### CRT-PUB-003 — Application status
Show submission timestamp, current state, next action, and review notes when safe to disclose. Never expose internal moderator notes or other applicants' data. An approved user is directed to Creator Studio after their authorization state refreshes.

## 4. Creator workspace shell

### Creator shell requirements
- Persistent workspace identity and current selected work.
- Navigation: Dashboard, My Stories, Chapters, Submissions, Feedback, Analytics, Earnings, Profile, Rights, Collaborators, Settings.
- Mobile: compact top bar plus accessible drawer or bottom-level creator navigation; avoid squeezing a full desktop sidebar into phone width.
- Persistent save/publish status region.
- Breadcrumbs identify current novel and chapter.
- Preview mode clearly distinguishes private preview from public published content.
- Destructive actions require explicit confirmation and explain consequences.
- No admin-only controls in creator navigation.

## 5. Creator Studio screen registry

### CRT-001 — Creator dashboard
**Logical route:** `/creator/dashboard`; preserve any existing `/author` entry route as a compatibility alias until router audit confirms redirects.  
**Audience:** approved authors and explicitly authorized staff.  
**Purpose:** Provide an actionable overview, not a vanity dashboard.

**Sections:** work requiring attention, drafts, published works, recent chapter activity, review feedback, rights tasks, analytics snapshot, creator announcements, and shortcuts.

**Data rules:** counts derive from owned/assigned records; publication counts include only published records; earnings show only finalized/ledger-backed values. A failed widget must not blank the entire dashboard.

### CRT-002 — My stories
**Route proposal:** `/creator/novels`  
List owned and assigned works with title, format, language, publication/review state, updated timestamp, chapter counts, and available actions. Filters: draft, in review, scheduled, published, rejected/revision requested, archived. Search and pagination preserve URL state.

### CRT-003 — Create story
**Route proposal:** `/creator/novels/new`  
**Observed client fields:** title, format, synopsis, language, ongoing/completed status, rights status, rights evidence, and rights notes.  
**Creation result:** private draft, never immediate publication.

**Validation:** title required and length-bounded; format must come from server registry; language must use a supported locale/code or reviewed free-text policy; status allowlisted; rights status allowlisted; non-original rights require evidence and human review. Do not treat a pasted URL as proof of authorization.

### CRT-004 — Story workspace / overview
**Route proposal:** `/creator/novels/:id`  
Show story metadata, current workflow state, chapter list summary, rights status, collaboration, feedback, and next allowed action. Every record access checks ownership or assignment on the server.

### CRT-005 — Edit story metadata
**Route proposal:** `/creator/novels/:id/edit`  
Edit title, synopsis, cover, language, taxonomy, content warnings, format, and status where permitted. Sensitive rights changes trigger re-review. Slug/URL changes require canonical and redirect handling.

### CRT-006 — Chapter manager
**Route proposal:** `/creator/novels/:id/chapters`  
Show chapter order, title, draft/published state, scheduled time, revision state, word/page count, last save, and allowed actions. Reordering must be transactional and reject duplicate order positions.

### CRT-007 — New chapter
**Route proposal:** `/creator/novels/:id/chapters/new`  
Editor with title, chapter body, optional author note, access/ticket settings if enabled, and save-draft action. Text and illustrated/comic formats use separate validated content models. The editor must warn before navigation with unsaved changes.

### CRT-008 — Chapter editor
**Route proposal:** `/creator/chapters/:id/edit`  
Required behaviors: autosave with debounce and explicit save indicator; manual save; revision history; preview; word count; safe paste; content sanitization; conflict detection; recoverable drafts; mobile keyboard-aware layout; accessible toolbar. A save conflict offers compare/reload/reapply rather than last-write-wins data loss.

### CRT-009 — Chapter revisions
**Route proposal:** `/creator/chapters/:id/revisions`  
Immutable revision history with author, timestamp, revision status, and comparison. Restore creates a new revision; it does not erase history. Published revision replacement may require review and must be auditable.

### CRT-010 — Submission center
**Route proposal:** `/creator/submissions`  
Show pending, approved, rejected, and revision-requested submissions with timestamps and actionable review feedback. Submission is idempotent; server validates rights, completeness, policy, and ownership.

### CRT-011 — Scheduled publishing
**Route proposal:** `/creator/scheduled`  
List scheduled chapters with timezone, target publication time, and cancellation/reschedule controls. Server stores canonical UTC time and preserves the user's display timezone. Scheduling is unavailable if the publishing job system is not healthy.

### CRT-012 — Reader feedback and chapter comments
**Route proposal:** `/creator/feedback`  
Display reader feedback allowed by privacy and moderation policy. Authors can respond only where policy permits. Hidden, deleted, private, or moderation-only content must not leak.

### CRT-013 — Creator analytics
**Observed API:** `GET /api/author/analytics?days=7|30|90`.  
**Observed semantics:** owned works; period view requests from daily instrumentation; lifetime request counters; chapter unlocks; reader ticket spend; comments, reactions, follows, ratings and bookmarks; daily timeline and chapter performance. The client explicitly notes that lifetime views are request counters, period instrumentation is not backfilled, and reader ticket spend is not author income.

**Screen requirements:**
- Range selector 7/30/90 days.
- Generated-at and freshness indicator.
- Story and chapter breakdowns.
- Definitions beside each metric.
- Empty/partial-data messaging when instrumentation coverage is incomplete.
- No inference of unique readers from request counters.
- No conversion of reader ticket spend into creator revenue.
- CSV/export only after privacy and rate-limit policy is defined.

### CRT-014 — Earnings and payouts
**Route proposal:** `/creator/earnings`, `/creator/payouts`  
Separate gross reader spend, platform fees, adjustments, pending earnings, approved payable amount, paid amount, and payout history. Only immutable ledger-backed amounts are shown as financial facts. If merchant/payout integration is not configured, clearly state that payouts are unavailable and do not collect unnecessary financial data.

### CRT-015 — Creator profile
**Route proposal:** `/creator/profile`  
Edit public display name, bio, avatar, links, language, and profile visibility. Preview public profile before publishing. Validate URLs and protect against impersonation.

### CRT-016 — Rights and permissions
**Route proposal:** `/creator/rights`  
Show each work's rights classification, evidence submission, review status, claims, restrictions, and withdrawal/appeal process. Distinguish author attestation from verified license. A work can be paused or removed while a credible rights dispute is reviewed.

### CRT-017 — Collaborators
**Route proposal:** `/creator/collaborators`  
Invite collaborators by account identifier/email through a secure invitation flow. Grant least-privilege per-work roles (viewer, editor, submitter) with expiry and revocation. Collaborators cannot transfer ownership, alter rights status, or publish unless explicitly authorized. Log all access changes.

### CRT-018 — Creator settings
**Route proposal:** `/creator/settings`  
Autosave preferences, notification choices, default language/format, editor preferences, and accessibility settings. Account security remains in account settings.

## 6. AI inside Creator Studio

AI Author Studio is an optional creator tool, not a dependency for manual writing.

**Observed feature-branch endpoints:** `/api/author/ai/projects`, project detail GET/PATCH, `/blueprint`, `/run`, `/jobs`, and `/api/author/ai/benchmarks`. The code checks for a configured server-side `OPENAI_API_KEY` and returns a service-unavailable response when generation is not configured. AI projects and generated chapters are owner-scoped. Generated chapter output is stored as a draft; automatic publishing is disabled in the observed flow.

**Screen requirements:**
- Workspace list and project detail.
- Manual writing remains available without AI provider credentials.
- Clear provider availability and usage/cost disclosure before generation.
- Story Bible, plot, character, worldbuilding, outline, continuity and draft generation as separate actions.
- Preview generated text before saving.
- User can edit, reject, regenerate, export, or delete generated drafts subject to retention rules.
- Show provider, request time, usage, and failure state where available.
- Never claim output is fact-checked, rights-cleared, or publication-ready automatically.
- No silent AI execution or auto-publication.
- Respect user privacy, retention settings, and consent.

## 7. Community experience

### COM-001 — Community hub
**Route:** `/community`  
**Shell:** Community.  
**Purpose:** Discover conversations and community activity while keeping reading and creator experiences connected.

**Sections:** community introduction, active discussions, recent posts, reviews, groups, events, and safety guidelines. Personal feed modules appear only for authenticated users with the required data.

### COM-002 — Community feed
**Route proposal:** `/community/feed`  
Feed filters: following, recent, relevant, and supported topic/category filters. Each item identifies author, timestamp, edited state, context/work link, and visibility. Ranking must be transparent enough to avoid implying chronology when personalized ranking is used.

### COM-003 — Create post
**Route proposal:** `/community/posts/new`  
Composer supports bounded text and approved media types. Preview before publish. Validate uploads and external links. Require authenticated account; apply rate limits, anti-spam, content policy, and moderation checks. Show post-publication result and permalink.

### COM-004 — Post detail
**Route proposal:** `/community/posts/:id`  
Display post, threaded comments where supported, reactions, share, edit/delete for owner within policy, and report action. Deleted/removed posts show a safe tombstone only when policy permits.

### COM-005 — Discussions
**Routes:** `/community/discussions`, `/community/discussions/new`, `/community/discussions/:id`  
Discussion detail includes topic, creator, participants, replies, follow/subscription, moderation status, and report controls. Thread depth and pagination must be bounded. Prevent duplicate submissions and sanitize rich text.

### COM-006 — Reviews
**Routes:** `/community/reviews`, `/community/reviews/new`, `/community/reviews/:id`  
Reviews are attached to a novel or another explicitly supported entity. User ratings are whole integers 1–10. Review edit history, helpful reactions, spoiler controls, and reports are supported. Aggregate ratings disclose sample count and exclude ineligible/removed ratings according to policy.

### COM-007 — Groups
**Routes:** `/community/groups`, `/community/groups/:slug`  
Group detail defines public/private/approval membership, rules, moderators, posts, and member list visibility. Private group content is never indexed or cached publicly. Membership changes are auditable.

### COM-008 — Events
**Route:** `/community/events`  
Show event timezone, start/end, organizer, eligibility, capacity if enforced, and registration state. Expired events remain accessible only under an explicit archive policy.

### COM-009 — Following and followers
**Routes:** `/following`, `/followers`  
Respect profile privacy and block relationships. Follow/unfollow is idempotent; counts refresh from authoritative data and do not expose private membership.

## 8. Messaging and notifications

### MSG-001 — Conversation inbox
**Route:** `/messages`  
Private authenticated screen. Show conversation participants, last message preview, unread state, and pagination. Never index. Search must be scoped to conversations the current user may access.

### MSG-002 — Conversation detail
**Route:** `/messages/:conversationId`  
Check conversation membership on every request and event delivery. Support text first; media only after upload scanning and retention design. Include send status, retry, edit/delete policy, read receipts opt-in/policy, block/report, and rate limiting. Reconnection must recover missed messages from the server; event delivery is not the source of truth.

### NTF-001 — Notification center
**Route:** `/notifications`  
Tabs/filters for all, unread, mentions, creator, community, security, and payments where applicable. Each notification links only to a resource the recipient can still access. Mark-read and mark-all-read are idempotent. Expose generated time and stale/offline state.

### NTF-002 — Mentions
**Route:** `/notifications/mentions`  
Show only mentions visible to the recipient. Deleted/private source content follows privacy policy. Provide mute/block/report controls where appropriate.

### Real-time contract
- Persist message and notification records before emitting events.
- Events are hints to refresh authoritative records; never trust event payload as final permission proof.
- Use authenticated channel subscriptions, per-user authorization, sequence/cursor recovery, reconnect backoff, duplicate-event handling, and bounded payloads.
- If push transport is unavailable, use bounded polling while the screen is visible and show freshness accurately.
- Never show “online now” unless an explicit presence protocol with a defined heartbeat/expiry policy exists.

## 9. Cross-domain API contracts to formalize

The following are logical contract groups. Exact paths and schemas must be verified against the Worker before implementation:
- Author applications: create, read own status, withdraw/resubmit according to policy.
- Creator works: list own/assigned, create draft, read, update metadata, archive.
- Chapters: create draft, update draft, save revision, preview, submit, schedule, cancel schedule, publish after approval, retrieve revisions.
- Collaborators: invite, accept, change scoped role, revoke, list.
- Analytics: read owned-work aggregates with explicit date window and metric definitions.
- Community: list/create/read/update/delete posts; comments; reactions; reviews; discussions; groups; events; reports.
- Messaging: list conversations, create authorized conversation, fetch messages by cursor, send, mark read, block/report.
- Notifications: list by cursor/filter, mark one/all read, update preferences.
- AI: list/create/update projects, request generation, inspect jobs, cancel where supported, retrieve generated draft. All AI endpoints are owner-scoped and quota-protected.

All mutations require authentication, server-side authorization, schema validation, CSRF protections where cookie sessions are used, rate limiting, idempotency where duplicate submission could cause harm, and structured error responses.

## 10. Privacy, moderation and safety rules

- Private messages, drafts, application evidence, unpublished works, and private group content are never exposed through public search, sitemap, public cache, or public analytics.
- Report flows preserve evidence according to a documented retention policy and limit access to authorized moderators.
- Block relationships affect follows, messages, mentions, group interactions, and recommendations consistently.
- Moderation actions include actor, reason, target, timestamp, policy reference, and appeal path.
- Authors cannot moderate reports against themselves or alter staff decisions.
- User-facing explanations must not reveal sensitive anti-abuse signals or private reporter identity.
- Export and deletion workflows must explain legal/financial/audit retention exceptions.

## 11. Acceptance tests

### Creator
- Reader cannot call creator APIs by manually constructing requests.
- Author cannot access another author's novel, draft, chapter, analytics, or AI project.
- Collaborator can access only explicitly assigned work and permissions.
- Draft remains private before approval and publication.
- Rights evidence is required for non-original rights claims and reviewed by an authorized role.
- Autosave survives refresh/network interruption and prevents stale overwrite.
- Published chapter revisions preserve history.
- Analytics label request counts and ticket spend accurately.
- AI unconfigured state leaves manual writing functional and no fake generation occurs.
- AI output is saved as draft only and never auto-published.

### Community and communication
- Anonymous visitor cannot create posts, reviews, messages, or reactions.
- Private group and conversation data cannot be accessed by non-members.
- Blocked users cannot bypass restrictions via direct API calls.
- Duplicate reaction/follow/message submissions are handled safely.
- Reported content follows moderation state and audit policy.
- Notification events cannot reveal resources the recipient cannot access.
- Reconnect recovers missed messages/notifications without duplicates.
- RTL, keyboard, screen reader, mobile viewport, offline, and long-content cases pass.

## 12. Unresolved repository reconciliation tasks

- [ ] Inventory all current author routes and application status endpoints on the target branch and production.
- [ ] Inventory actual create/update/list/publish chapter and novel API handlers.
- [ ] Verify current autosave, revision, scheduling, and publication approval behavior.
- [ ] Inspect actual community, comments, reviews, groups, follows, and report handlers.
- [ ] Inspect whether messaging and notification APIs exist and whether transport is polling, SSE, or WebSocket.
- [ ] Inspect D1 tables and migration history before finalizing entity names.
- [ ] Reconcile route aliases `/author`, `/creator/*`, `/become-an-author`, `/messages`, and `/notifications`.
- [ ] Verify every creator and community permission against Phase 01I.
- [ ] Verify exact endpoint schemas and event contracts against Phase 01J.
- [ ] Obtain architecture review before any engineering implementation.

## 13. Evidence boundary

This document uses source observations from the PR #120 feature branch, including the author application client, author analytics endpoint, and AI Author project/job handlers. It does not claim that all listed proposed routes or contracts exist in production. No production writes, database queries, migrations, merges, or deployments were performed for this increment.
