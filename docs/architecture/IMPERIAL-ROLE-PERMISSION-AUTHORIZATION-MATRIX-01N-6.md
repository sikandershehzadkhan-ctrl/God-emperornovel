# Imperial Novel: Role, Permission and Authorization Matrix

**Programme:** Phase 01N architecture
**Status:** Proposed authorization contract; not implemented or security-tested
**Branch:** `architecture/phase-01n-master-route-registry`
**Scope:** Roles, resource ownership, delegated access, API and route authorization, negative tests

## 1. Purpose and non-negotiable rules

This document defines who may do what, to which resource, under what conditions. A visible button, hidden menu item, route name, client-supplied user ID, or role value in a request is never proof of permission.

Authorization is enforced server-side for every protected read and write. The system uses deny-by-default decisions, least privilege, explicit resource relationships, and auditable policy changes. Every request is evaluated against the authenticated principal, action, resource, resource owner, resource state, scope, and relevant policy conditions.

**Owner model:** Imperial Novel has one human owner: the platform owner. No co-owner, staff member, moderator, agent, or service identity is assumed to exist. Optional delegated identities remain unassigned and disabled until the owner explicitly enables them.

## 2. Principal types

| Principal | Default state | Authority boundary |
|---|---|---|
| Anonymous visitor (guest) | Enabled | Public, published, explicitly public resources only |
| Registered reader | Enabled after verified account creation | Own account and permitted reader actions; no authority over another user |
| Author | Granted only after approved author status | Own creator workspace and explicitly granted collaborators/resources |
| Platform owner | One designated human principal | Platform governance and emergency controls; protected by strong authentication and audit |
| Delegated human role | Unassigned and disabled | Narrow, time-bounded, explicitly scoped permissions only |
| Service/agent identity | Disabled until configured | Machine-only, narrowly scoped capabilities; never human-owner authority |

Roles describe broad capability bundles. They do not replace resource-level authorization. A user may be both a reader and an author; the author capability is additive and does not grant access to other authors' private resources.

## 3. Core authorization model

Evaluate each operation using the following conceptual inputs:

- `principal`: authenticated user or named service identity
- `action`: read, create, update, delete, publish, moderate, export, refund, configure, or other explicit verb
- `resource`: concrete record or collection
- `relationship`: owner, explicitly invited collaborator, assigned moderator scope, or no relationship
- `resource_state`: draft, submitted, published, hidden, suspended, archived, deleted, or payment state
- `context`: account status, verification, consent, age/eligibility where applicable, rate limits, session assurance, and legal/policy restrictions

Decision order:

1. Reject malformed, unauthenticated, expired, revoked, or disabled principals.
2. Reject actions not explicitly granted to that principal type.
3. Resolve the resource on the server and derive its true owner and tenant boundary.
4. Check the principal's relationship to that resource and the resource's current state.
5. Apply contextual constraints, field-level restrictions, and policy conditions.
6. Record security-relevant actions and return only fields the principal may see.

Unknown actions, missing ownership data, ambiguous resource relationships, policy-service failure, or unavailable authorization state must fail closed for protected operations.

## 4. Role capability matrix

Legend: **Yes** means the baseline capability is allowed within the stated boundary. **Conditional** requires a separate relationship, policy, or approval. **No** means not granted by this role.

| Capability | Guest | Reader | Author | Platform owner | Future delegated role |
|---|---:|---:|---:|---:|---:|
| Read public published catalog and chapters | Yes | Yes | Yes | Yes | Conditional |
| Search public metadata | Yes | Yes | Yes | Yes | Conditional |
| Create and manage own account | No | Yes | Yes | Yes, own account | No by default |
| Manage own library, history, follows and reading position | No | Yes | Yes | Yes, own account | No by default |
| Comment, rate and vote under published rules | No | Yes | Yes | Yes, subject to same public rules | Conditional |
| Report content or abuse | No | Yes | Yes | Yes | Conditional |
| Create private novel drafts | No | No | Yes, own workspace | Yes, through owner control plane | No by default |
| Edit own novel and chapters | No | No | Yes | Yes | Conditional, explicit resource grant |
| Submit own work for publication | No | No | Yes | Yes | No by default |
| Publish or unpublish creator content | No | No | Conditional, policy/approval gated | Yes | No by default |
| View own creator analytics | No | No | Yes | Yes | Conditional, read-only grant |
| Manage another user's account or content | No | No | No | Yes, legitimate governance purpose | No by default |
| Change platform roles or authorization policies | No | No | No | Yes, strong-auth + audit | No by default |
| View private user data | No | Own data only | Own data only | Restricted, purpose-bound | No by default |
| View financial/security secrets | No | No | No | Restricted, explicit operational need | No by default |
| Approve/refund/adjust payments or ticket ledger | No | No | No | Yes, step-up auth + immutable audit | No by default |
| Configure providers, secrets, domains or deployment | No | No | No | Yes, step-up auth + audit | No by default |

Owner authority is not a blanket reason to expose all personal data in routine screens. Sensitive access must be purpose-bound, minimized, logged, and reviewed. Secrets should be revealable only where operationally necessary and preferably not retrievable after initial storage.

## 5. Resource ownership and relationship rules

| Resource | Authoritative owner | Baseline access rule |
|---|---|---|
| Account, profile, preferences, sessions | User account | User manages own data; public profile fields follow explicit visibility settings |
| Library, bookmarks, reading history, reading position | User account | Private to that user; never enumerable by another user |
| Notifications and notification preferences | Recipient user | Recipient only; service may deliver but not browse content broadly |
| Comments, ratings, votes and reports | Creating user for edit/delete rights; platform for policy enforcement | Public visibility follows moderation state; no user may impersonate or alter another user's contribution |
| Novel and chapter drafts | Author account or explicitly defined creator workspace | Owner and explicitly invited collaborators only |
| Published novel and chapter | Publishing author/creator workspace, subject to platform rights and policy | Public read only when publication and rights state permit |
| Cover art, attachments and source files | Uploader/creator workspace | Private until explicitly published; validate file and access on every request |
| Author analytics | Author/workspace | Only aggregated data and permitted own-work metrics; no unrestricted reader identity disclosure |
| Tickets, payment intents and ledger entries | User/account plus platform financial ledger | User sees own transactions; owner has audited operational access |
| Provider connections and credentials | Platform owner or explicitly scoped workspace | Secrets never exposed to ordinary clients, authors, logs, or analytics |
| Moderation cases | Platform governance | Assigned, scoped access only; reporter and subject see only policy-permitted status |
| Audit and security events | Platform security boundary | Restricted, append-only where feasible, no ordinary user access |

Every tenant-owned table and object must carry or resolve an authoritative owner/workspace identifier. Ownership is derived from trusted server-side records, not accepted from request payloads. A record without a valid owner relationship is inaccessible until reconciled.

## 6. Collaborator grants

Future author collaboration may be supported through explicit grants, not broad role elevation. A grant must include:

- grant ID, grantor, grantee, target workspace/resource, allowed actions, denied actions
- scope (specific novel, chapter set, or workspace), start and expiry time
- status, reason, approval evidence where required, and revocation timestamp
- audit events for creation, use of sensitive capabilities, change, expiry, and revocation

Default collaborator permissions should be narrow: view selected drafts, edit selected chapters, or comment on drafts. Publishing, deleting a project, changing ownership, viewing financial data, managing provider connections, exporting user data, or changing access grants are excluded unless separately designed and approved.

Revocation takes effect on the next authorization check. Cached grants must have short, bounded lifetimes or be invalidated. A collaborator cannot grant access they do not possess, change the workspace owner, or extend their own grant.

## 7. User-to-user privacy and anti-interference

- A user cannot read, edit, delete, export, or enumerate another user's private profile fields, sessions, email, phone, library, history, reading position, drafts, payment records, notifications, or reports.
- Public profile visibility is field-specific and opt-in where appropriate. Private contact details remain private regardless of public profile visibility.
- Blocking or muting, if implemented, must be enforced consistently across comments, follows, notifications, recommendations, search surfaces, and community interactions.
- Users cannot bypass a block by changing URL IDs, API parameters, pagination cursors, alternate endpoints, or cached responses.
- Users cannot modify another user's comment, rating, vote, review, reading progress, author application, ticket balance, or payment status.
- Reports and moderation evidence are private to authorized governance workflows. Do not reveal reporter identity to the reported user by default.
- Aggregate analytics must apply minimum cohort thresholds where small groups could expose an individual's behavior.

## 8. Route and API authorization contract

Routes are presentation entry points, not security boundaries. Each route maps to one or more server actions, and each server action independently enforces the policy below.

| Route family | Guest | Signed-in user | Author | Owner |
|---|---|---|---|---|
| Public home, catalog, genres, tags, formats, rankings | Public published data | Same | Same | Same |
| Novel detail and chapter archive | Public published data | Same | Same | Same |
| Chapter reader | Published and rights-cleared chapter only | Same plus own reading state | Same | Same |
| Login, registration, recovery | Public entry | Redirect/appropriate account state | Same | Same |
| Library, history, following, notifications, account, settings | Denied | Own resources only | Own resources only | Own resources only |
| Author application | Public information; submit requires account | Own application | Own status | Governance view/action |
| Creator Studio, drafts, analytics, submissions | Denied | Denied unless approved author capability | Own workspace and granted scopes | Owner governance |
| Community interactions | Read public permitted content | Own contributions and permitted interactions | Same | Same policy, plus governance |
| Tickets and payment history | Public package information only | Own ledger and intents | Own ledger | Audited financial operations |
| OmniPortal and Trend Factory | Public status/metadata only where enabled | Feature-specific permissions | Own authorized workflow | Provider and policy governance |
| Admin and security console | Denied | Denied | Denied | Owner-only baseline |

Every API endpoint must declare: HTTP method, action, authentication requirement, permission predicate, resource ownership source, allowed fields, validation schema, rate limit, audit requirement, cache policy, and negative tests. No endpoint inherits trust from its caller's UI.

## 9. Sensitive owner operations

Require fresh step-up authentication for high-impact actions such as changing owner identity, granting/revoking privileged access, changing security settings, exporting sensitive datasets, modifying payment ledger entries, rotating provider credentials, changing domain/deployment controls, or disabling security monitoring.

Where feasible, high-impact operations should use confirmation, idempotency keys, immutable audit records, and a recovery/rollback plan. A single compromised browser session must not silently enable permanent privilege escalation.

## 10. Service and agent identities

Agents are optional machine identities, not people and not platform owners. They remain disabled until a specific service is implemented, reviewed, and enabled by the owner.

| Proposed identity | Allowed scope if later enabled | Explicit exclusions |
|---|---|---|
| Revenue service | Read aggregate revenue metrics; reconcile explicitly scoped payment events | No arbitrary refunds, ledger edits, secret access, or role changes |
| Provider Health service | Read provider health and operational status | No credential disclosure or provider configuration changes |
| Duplicate Detection service | Read approved metadata and emit candidate matches | No automatic deletion, ownership transfer, or content ingestion outside rights |
| Catalog Steward service | Propose metadata corrections for review | No unreviewed publication or rights decisions |
| Security Sentinel service | Read security telemetry and create alerts/cases | No autonomous account takeover, privilege grant, or evidence deletion |
| Analytics service | Read minimized event streams and produce aggregates | No raw private-user browsing or cross-tenant exports |
| Omni Orchestrator service | Execute explicitly approved provider workflows | No chapter-body ingestion before rights approval; no arbitrary secret or account access |

Each service receives a unique identity, narrowly scoped credentials, explicit resource allowlists, rate limits, expiry/rotation, and audit trails. Services cannot mint owner sessions, change role policy, or delegate permissions.

## 11. Required security controls

- Deny by default; centralized policy evaluation with endpoint-level enforcement.
- Object-level authorization on every read and write, including nested resources and bulk operations.
- Field-level response filtering and mass-assignment protection.
- Server-side validation of ownership, status transitions, and allowed state changes.
- CSRF protection for cookie-authenticated mutations; secure, HttpOnly, SameSite cookies and origin checks as appropriate.
- Session rotation after authentication and privilege changes; revocation on logout, compromise, password reset, and account suspension.
- Rate limits and abuse controls for login, recovery, comments, votes, reports, uploads, exports, and payment operations.
- Cache keys partitioned by authorization context; private responses marked non-shared-cacheable.
- Audit records for role changes, grants, exports, moderation actions, payment changes, owner operations, and security events.
- No secrets, session tokens, recovery codes, private message content, or sensitive personal data in logs.

## 12. Mandatory negative authorization tests

Every protected endpoint must have tests proving that forbidden access is denied. At minimum:

1. User A cannot GET User B's library, history, profile-private fields, notifications, sessions, or payment ledger by substituting IDs.
2. User A cannot PATCH or DELETE User B's comment, novel, chapter, rating, reading position, application, or ticket record.
3. A reader cannot access creator drafts by guessing a novel or workspace ID.
4. An author cannot access another author's unpublished chapters or analytics without an explicit valid grant.
5. An expired, revoked, disabled, or out-of-scope collaborator grant is denied immediately.
6. A collaborator cannot publish, delete, transfer ownership, invite another collaborator, or expand their own grant unless separately authorized.
7. A suspended account cannot continue protected mutations through an old session or alternate API route.
8. A client-supplied `role`, `ownerId`, `userId`, `workspaceId`, or `isAdmin` value cannot elevate authority or redirect ownership.
9. Bulk endpoints, exports, search filters, pagination cursors, nested routes, and alternate HTTP methods enforce the same object-level policy.
10. Admin endpoints reject all non-owner principals under the baseline single-owner model.
11. Service identities cannot call human-only owner operations or access resources outside their allowlist.
12. Private responses are never served from a shared cache to another user or anonymous visitor.
13. Authorization-service or ownership-resolution failure denies protected access and does not fall back to permissive behavior.
14. Repeated requests and retries cannot duplicate payment credits, grants, publication transitions, or other privileged side effects.

Tests must assert both status and absence of leaked data. A generic 403/404 response is not enough if response bodies, timing, logs, or cache behavior still disclose private information.

## 13. Audit requirements

Record principal, action, target resource, decision, policy version, timestamp, correlation ID, and relevant grant/approval reference. Minimize personal data in audit records. Protect logs against ordinary-user modification and define retention and access rules.

Audit access itself. Owner access to sensitive personal or financial records should have a reason code and produce an event. Security investigations must preserve evidence while limiting who can view it.

## 14. Migration plan from the observed simple role model

The current source audit observed simple `users.role` values (`user`, `author`, `moderator`, `admin`) and an admin user-update path that can change role/verification/ban fields. This document does not claim those existing paths are secure or that the proposed model exists in code.

Migration must be staged:

1. Inventory every current route, API handler, role check, ownership check, and write path.
2. Identify the actual single owner account using verified operational evidence; do not infer owner identity from a client-supplied role.
3. Define compatibility mapping for existing accounts and moderation capabilities; preserve current access only where explicitly justified.
4. Add policy and relationship data with safe defaults; backfill ownership and flag orphaned records.
5. Add centralized authorization helpers and endpoint-by-endpoint enforcement.
6. Add negative tests before exposing new route families or collaboration features.
7. Remove direct role mutation from general profile/admin flows; route privileged changes through owner-only audited operations.
8. Run shadow evaluation and compare decisions before enforcing new policy where safe.
9. Enable enforcement by feature flag, monitor denials and regressions, and retain rollback.
10. Revoke legacy broad permissions that have no approved replacement.

Never perform a destructive role or ownership migration without a verified backup, restore test, migration dry run, and reconciliation report.

## 15. Completion gates

- [ ] Every route and API action has an explicit authorization declaration.
- [ ] Every user-owned resource has a verified owner/workspace relationship.
- [ ] No protected read/write trusts client-supplied identity or role fields.
- [ ] Object-level and field-level checks cover direct, nested, bulk, export, and alternate-method access.
- [ ] Owner identity and recovery path are verified; strong authentication and step-up controls are tested.
- [ ] Delegated roles and service identities are disabled unless individually approved and scoped.
- [ ] Negative tests pass for cross-user, cross-author, expired-grant, privilege-escalation, and cache-isolation cases.
- [ ] Audit records, alerting, revocation, and incident response are tested.
- [ ] Migration and rollback are rehearsed against a restorable backup.
- [ ] Security review confirms the implementation matches this policy.

**Current phase result:** Architecture contract drafted. Implementation, migration, penetration testing, and production enforcement remain unverified. This document is not a security certification or a claim that user data is already protected by these controls.

## 16. Decisions intentionally left open

- Exact owner-account identifier and recovery custodianship must be verified from the live account configuration.
- Whether author publication is immediate or requires editorial approval must be decided against the actual content-rights and moderation workflow.
- Whether moderators will ever be delegated, and their exact case/region/category scopes, remains owner-controlled and disabled by default.
- Collaborator feature design and consent flows require a separate product decision before implementation.
- Retention periods, lawful basis, and data-subject request procedures require jurisdiction-aware legal review.

---

**Next architecture dependency:** map every persisted entity to its owner, keys, relationships, visibility, retention, and lifecycle before designing migrations or enforcing these policies.