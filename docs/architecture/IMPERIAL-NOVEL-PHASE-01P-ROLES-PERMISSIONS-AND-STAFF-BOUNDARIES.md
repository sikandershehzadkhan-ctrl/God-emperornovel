# Imperial Novel | Phase 01P: Roles, Permissions & Staff Boundaries

**Review date:** 2026-11-01  
**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Target authorization architecture. Existing application code is not yet migrated to this model.

## 1. Current implementation: verified boundary

Static inspection of `src/index.js` shows the current role values accepted by the admin user PATCH route are:
- `user`
- `author`
- `moderator`
- `admin`

The Worker has coarse guards:
- `need(u)`: authenticated user required;
- `admin(u)`: `u.role === "admin"`;
- `author(u)`: admin or author.

The author application approval flow changes an eligible, non-banned applicant from `user` to `author`. The admin user PATCH route can directly set one of the four role strings and also changes verified/banned flags. This is a coarse role model, not granular RBAC/ABAC.

**Important:** all staff roles proposed below are design targets. They are not currently implemented or safe to assign in the database.

## 2. Design principles

1. Deny by default. Every API operation checks permission on the server.
2. Authentication, role, account state and resource ownership are separate concepts.
3. RBAC grants a job capability; ABAC limits it by resource, region, ownership, status and sensitivity.
4. UI visibility is never an authorization boundary.
5. A role grants only the minimum permissions needed for its work.
6. High-risk actions require reason, durable audit and sometimes a second approver.
7. No staff member may approve their own submission or their own financial/rights change.
8. No agent or automation can grant itself a role, bypass policy or self-approve high-risk work.
9. Staff access to private user content is purpose-limited, time-bound and audited.
10. Emergency access expires automatically and receives retrospective review.

## 3. Account state is not a role

Account state is an independent lifecycle:
- `active`
- `email_unverified`
- `restricted`
- `suspended`
- `banned`
- `deletion_pending`
- `deleted_or_anonymized` (where legally and technically appropriate)

A user can be an author and become suspended without losing the historical fact that they were an author. A ban must not be represented by silently rewriting their role. State transitions require an actor, reason, timestamp and audit event.

## 4. Proposed role catalogue

| Role | Purpose | Default boundary |
|---|---|---|
| Reader (`user`) | Read, library, ratings, community participation | Own account and public/eligible content |
| Author (`author`) | Create and manage own works | Own drafts, chapters, projects and analytics |
| Moderator (`moderator`) | Community safety and report handling | Assigned queues and cases; no finance, provider secrets or role grants |
| Support Agent (`support_agent`) | Help and account assistance | Assigned support cases and limited account metadata; no private content by default |
| Content Editor (`content_editor`) | Editorial review and metadata quality | Assigned editorial queue; cannot approve rights or financial changes |
| Rights Reviewer (`rights_reviewer`) | Verify licenses, permissions and provenance | Rights evidence and rights decisions only; no payment approval |
| Publishing Manager (`publishing_manager`) | Approve scheduling/publication state | Publishing workflow; cannot self-approve own work or rights |
| Finance Operator (`finance_operator`) | Payment evidence and reconciliation | Financial queues and ledger read; no role grants or content moderation |
| Finance Approver (`finance_approver`) | Approve/refuse high-risk financial adjustments | Second-person approval; cannot initiate and approve same adjustment |
| Provider Operator (`provider_operator`) | Provider health and connector operations | Provider metadata/configuration without secret disclosure or rights approval |
| Security Analyst (`security_analyst`) | Alerts, incidents and investigation | Security cases and limited session metadata; no content or finance access unless separately granted |
| Security Administrator (`security_admin`) | Session revocation, incident containment and security policy | Security control plane; step-up authentication and audit required |
| Analyst (`analyst`) | Aggregated product and business analytics | De-identified/aggregated data; no private message or payment evidence |
| Agent Operator (`agent_operator`) | Run approved operational agents | Allowlisted jobs only; no policy editing or self-approval |
| Administrator (`admin`) | Platform configuration and delegated access management | Still permission-gated; high-risk actions require separation of duties |
| Super Administrator (`super_admin`) | Break-glass governance and recovery | Rare, time-bound, step-up, dual-controlled where possible, fully audited |

Do not add every role as a free-form value in `users.role`. The target model should support multiple role assignments and scoped grants, with a compatibility adapter for the current single role field during migration.

## 5. Permission namespaces

Permissions are action-specific and stable identifiers. Initial groups:

### Identity and access
- `identity.profile.read_own`
- `identity.profile.update_own`
- `identity.account.restrict`
- `identity.account.suspend`
- `identity.account.ban`
- `identity.session.read_own`
- `identity.session.revoke_own`
- `identity.session.revoke_any`
- `access.roles.read`
- `access.roles.assign`
- `access.grants.create`
- `access.grants.revoke`

### Author and publishing
- `author.apply`
- `author.work.create_own`
- `author.work.update_own`
- `author.chapter.publish_own`
- `author.analytics.read_own`
- `publishing.queue.read`
- `publishing.review`
- `publishing.approve`
- `publishing.unpublish`
- `publishing.schedule`

### Rights and provider
- `rights.evidence.read_assigned`
- `rights.review`
- `rights.approve`
- `provider.directory.read`
- `provider.health.read`
- `provider.config.manage`
- `provider.connector.enable`
- `provider.connector.disable`

### Community and support
- `community.report.read_assigned`
- `community.case.review`
- `community.content.hide`
- `community.appeal.review`
- `support.case.read_assigned`
- `support.case.reply`
- `support.account.assist_limited`

### Commerce and finance
- `commerce.ledger.read_own`
- `commerce.ledger.read_platform`
- `commerce.payment.review`
- `commerce.payment.approve`
- `commerce.refund.initiate`
- `commerce.adjustment.approve`
- `commerce.payout.review`

### Operations and security
- `operations.health.read`
- `operations.jobs.read`
- `operations.jobs.run_allowlisted`
- `security.alert.read`
- `security.incident.manage`
- `security.session.revoke_any`
- `security.policy.manage`
- `analytics.aggregate.read`
- `audit.events.read_scoped`
- `audit.events.read_global`
- `configuration.feature.manage`
- `configuration.system.manage`

Permission names are proposed contracts, not existing runtime checks. Every permission must have a documented resource scope and data classification.

## 6. Role-to-permission boundaries

| Role | Main grants | Explicit exclusions |
|---|---|---|
| Reader | Own profile/library, public reading, community participation | Staff queues, other users' private data |
| Author | Reader grants + own work CRUD, own analytics | Other authors' drafts, rights approval, financial approvals |
| Moderator | Assigned reports/cases, hide/remove within policy, appeal triage | Payment evidence, provider secrets, role assignment, global account access |
| Support Agent | Assigned support cases, limited account assistance | Private messages/reading history by default, finance approval, rights decisions |
| Content Editor | Assigned metadata/editorial review | Rights approval, payment approval, security policy |
| Rights Reviewer | Assigned rights evidence and rights decisions | Financial approval, provider secret access, own-work approval |
| Publishing Manager | Queue review, publish/schedule/unpublish under policy | Self-approval, rights override, ledger mutation |
| Finance Operator | Payment evidence, ledger reconciliation, payout review | Role management, content moderation, provider secret access |
| Finance Approver | Second-person approval of eligible financial actions | Approving own initiated action |
| Provider Operator | Provider health/config and connector operations | Rights approval, secret value read/export, payment approval |
| Security Analyst | Assigned alerts/incidents, scoped session metadata | Finance evidence, content editing, role grants |
| Security Administrator | Incident containment, session revocation, security policy | Unlogged access, self-approved privilege expansion |
| Analyst | Aggregated analytics | Raw private messages, payment evidence, secrets |
| Agent Operator | Allowlisted agent runs | Agent policy changes, role grants, unapproved actions |
| Administrator | Delegated platform management | Unrestricted access by role name alone |
| Super Administrator | Break-glass recovery and governance | Persistent routine use; silent or unaudited actions |

## 7. Mandatory separation-of-duty rules

- A user cannot approve their own author application, rights claim, publication, appeal, payment or payout.
- The person who initiates a refund/ledger adjustment cannot be its sole approver.
- Rights approval and publishing approval are distinct decisions.
- Provider health does not imply permission to import content.
- Provider configuration does not grant access to secret values.
- Role assignment requires a separate access-management permission, reason and audit.
- Granting `admin` or `super_admin` requires two authorized approvers and a time-bound elevation process.
- A security analyst cannot silently read private conversations without a documented incident purpose and scoped access grant.
- Agent runs cannot alter agent policy, permission mappings or their own role.
- The same person cannot create and approve a new permission grant for themselves.

## 8. Authorization evaluation contract

For every request, evaluate in this order:
1. authenticated identity and session validity;
2. account state permits this action;
3. role/grant includes the requested permission;
4. grant is active, unexpired and within scope;
5. resource belongs to the caller or is within an explicit staff assignment;
6. resource state permits the transition;
7. separation-of-duty and second-approval requirements pass;
8. rate limit and abuse policy pass;
9. audit intent is durably recorded for high-risk operations;
10. execute atomically where possible and record outcome.

If any step is unknown or fails, deny. Return safe 401/403/404/409 responses without revealing private resource existence unnecessarily.

## 9. Target data model

A future schema may include:
- `roles`: stable role key, display metadata, system-managed flag;
- `permissions`: stable permission key, domain, action, sensitivity;
- `role_permissions`: role-to-permission mapping with policy version;
- `user_role_assignments`: user, role, scope, grantor, reason, starts_at, expires_at, revoked_at;
- `resource_assignments`: staff queue/case/provider/region scope;
- `access_approval_requests`: requested grant, initiator, approvers, state and expiry;
- `access_audit_events`: actor, subject, permission, resource, outcome, reason, correlation ID.

This is a logical model only. Do not create these tables until the database migration authority phase approves their exact DDL and compatibility plan.

## 10. Migration from current four-role implementation

1. Inventory every role comparison and SQL role filter in the source.
2. Identify role values actually present in each supported environment; do not infer production distribution.
3. Map current `user`, `author`, `moderator`, `admin` to compatibility grants.
4. Add granular permission evaluation in a compatibility layer only after tests exist.
5. Migrate admin endpoints domain by domain, not with a global role-string replacement.
6. Replace direct user-role PATCH with audited grant workflow and protected last-admin recovery.
7. Introduce staff roles only when their scoped queues and policies are ready.
8. Verify that existing author ownership, moderation access and admin recovery remain intact.
9. Remove legacy coarse checks only after endpoint-by-endpoint coverage and negative tests pass.

## 11. Required security tests

- anonymous request to protected route;
- reader attempts author/admin/staff route;
- author accesses another author's novel, chapter, project or analytics;
- moderator attempts financial evidence, provider secret, or role change;
- finance operator attempts rights approval or moderation;
- rights reviewer attempts payout approval;
- publishing manager attempts to publish own work or bypass rights status;
- administrator attempts self-escalation to super_admin;
- user attempts to change their own role via profile or request body;
- expired or revoked grant;
- scope mismatch (wrong case, queue, provider or region);
- suspended/banned user with otherwise valid role;
- second approver is same as initiator;
- audit store unavailable during a high-risk operation;
- agent attempts policy mutation or role escalation;
- stale cached grant after revocation.

## 12. Implementation gate

**Role architecture is documented, not implemented.** Before code changes:
- complete route-by-route permission matrix;
- map every current role check and owner check;
- define data model and migration strategy;
- define staff operating model and who can hold each role;
- add unit and integration tests;
- define emergency access and account recovery;
- review privacy, legal and retention implications.

No user role, account state, database schema, API guard, secret or production configuration was changed.
