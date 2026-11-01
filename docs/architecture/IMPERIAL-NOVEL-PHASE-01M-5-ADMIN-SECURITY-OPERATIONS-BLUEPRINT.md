# Imperial Novel | Phase 01M.5: Administration, Security & Operations Blueprint

**Brand:** Read • Create • Conquer  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture specification only. No application or production changes.

## 1. Mission and control principles

The administration workspace is the operational control plane for Imperial Novel. It must make important platform state visible without granting every administrator unrestricted power.

- Deny by default; enforce authorization on the server for every request and resource.
- Separate content moderation, financial operations, security operations, user support, publishing, provider configuration and audit.
- Admin UI visibility is not authorization. Every action is independently checked server-side.
- High-impact actions require a reason, immutable audit record and, where specified, a second approver.
- No agent can grant itself permissions, change its own policy, approve its own high-risk output, or silently publish content.
- Security alerts are signals for investigation, not proof of wrongdoing.
- Preserve user privacy. Staff access to private content, messages or payment evidence is purpose-limited and audited.
- Emergency access is time-bound, step-up authenticated and reviewed after use.

## 2. Read-only repository evidence

Inspection of the feature-branch `src/index.js` found:
- A basic `admin(u)` guard checks the user's role equals `admin`; this is a coarse role check, not a demonstrated granular permission system.
- An `audit_logs` table and an audit helper exist. The helper catches insert errors, so audit-write failure handling must be strengthened before relying on it for high-risk actions.
- Existing admin endpoints include stats, users, agents, taxonomy, community comments/reports, author applications, publishing, donations, and selected catalog/reader operations.
- `GET /api/admin/agents` and `POST /api/admin/agents/run` exist and are admin-gated in the inspected source.
- Agent records include slug, name, role, icon, mode, status, enabled, last-run time and last result.
- The inspected seed includes specialist agents for moderation, revenue, provider health, catalog, duplicate detection, security, analytics, notifications and orchestration. The orchestrator description preserves rights, security and human-review boundaries.
- Scheduled automation invokes provider-health, notification, catalog, duplicate, security and analytics agents.
- Some agent work is local/rule-based; optional model-backed behavior depends on a configured OpenAI key. A seeded agent record or “ready” status is not proof of a functioning autonomous capability.
- User management exposes a limited user list and an admin PATCH route. Publishing, reports, author application and community moderation have distinct handlers but share the coarse admin role guard.
- The inspected source includes reports and comment reports, and admin endpoints to review community reports/comments.
- No full granular RBAC/ABAC enforcement, immutable append-only audit guarantee, security incident case lifecycle, trusted-device workflow or comprehensive staff session controls were verified in this inspection.

Read-only branch inspection only. No production data, live security posture, admin credentials, or deployed parity was tested.

## 3. Administration shell and route registry

Proposed routes. Existing admin routes must remain compatible until route migration is tested.

| ID | Route | Screen | Permission |
|---|---|---|---|
| ADM-001 | /admin | Command overview | admin.dashboard.read |
| ADM-002 | /admin/operations | Operations center | operations.read |
| ADM-003 | /admin/operations/health | Platform/provider health | operations.health.read |
| ADM-004 | /admin/operations/jobs | Background jobs | operations.jobs.read |
| ADM-005 | /admin/operations/jobs/:id | Job detail/recovery | operations.jobs.manage |
| ADM-006 | /admin/users | User directory | users.read |
| ADM-007 | /admin/users/:id | User profile and status | users.read |
| ADM-008 | /admin/users/:id/access | Roles and access grants | access.manage |
| ADM-009 | /admin/users/:id/sessions | Session review/revocation | sessions.manage |
| ADM-010 | /admin/roles | Role catalogue | access.roles.read |
| ADM-011 | /admin/roles/:id | Role and permission matrix | access.roles.manage |
| ADM-012 | /admin/moderation | Moderation overview | moderation.read |
| ADM-013 | /admin/moderation/queue | Reports and review queue | moderation.review |
| ADM-014 | /admin/moderation/cases/:id | Moderation case | moderation.case.manage |
| ADM-015 | /admin/moderation/policies | Moderation policy versions | moderation.policy.manage |
| ADM-016 | /admin/publishing | Publishing queue | publishing.review |
| ADM-017 | /admin/publishing/:id | Novel/chapter review | publishing.review |
| ADM-018 | /admin/agents | Agent registry | agents.read |
| ADM-019 | /admin/agents/:slug | Agent detail and capability | agents.read |
| ADM-020 | /admin/agents/:slug/runs | Agent run history | agents.runs.read |
| ADM-021 | /admin/agents/:slug/policies | Agent policy and approval gates | agents.policy.manage |
| ADM-022 | /admin/security | Security overview | security.read |
| ADM-023 | /admin/security/alerts | Security alert queue | security.alerts.read |
| ADM-024 | /admin/security/incidents/:id | Incident case and response | security.incidents.manage |
| ADM-025 | /admin/security/sessions | Active session overview | security.sessions.read |
| ADM-026 | /admin/security/audit | Security audit search | security.audit.read |
| ADM-027 | /admin/analytics | Platform analytics | analytics.read |
| ADM-028 | /admin/analytics/events | Event quality and coverage | analytics.events.read |
| ADM-029 | /admin/configuration | Safe configuration overview | configuration.read |
| ADM-030 | /admin/configuration/features | Feature flags | configuration.features.manage |
| ADM-031 | /admin/configuration/maintenance | Maintenance controls | configuration.maintenance.manage |
| ADM-032 | /admin/audit | Global audit trail | audit.read |
| ADM-033 | /admin/audit/:eventId | Audit event detail | audit.read |
| ADM-034 | /admin/announcements | Platform announcements | announcements.manage |
| ADM-035 | /admin/support | Support case overview | support.read |
| ADM-036 | /admin/support/:caseId | Support case detail | support.case.manage |
| ADM-037 | /admin/system | Runtime and release information | system.read |
| ADM-038 | /admin/system/diagnostics | Safe diagnostic reports | system.diagnostics.read |

## 4. Command overview and operations center

The dashboard should summarize:
- service health with measured check time;
- current error rate and latency only where instrumentation exists;
- queue depth and oldest pending item;
- publishing and moderation backlog;
- provider/connector rights and health states;
- payment verification backlog without exposing sensitive payment evidence;
- active incidents and unresolved high-severity alerts;
- last successful backup/export only if such a process is actually configured;
- latest release identifier and deployment timestamp only from verified deployment metadata.

Every metric has a definition, time window, source and freshness label. Missing instrumentation displays “not measured”, never zero. Dashboard cards link to the underlying filtered record list.

## 5. User, roles and session management

### User directory
Search by exact username/email or stable ID, filter by account state and role, and show only fields needed for the task. Avoid bulk exposure of email or other personal information.

### Account state
Keep role separate from account state. Proposed states: active, email_unverified, restricted, suspended, banned, deletion_pending and deleted/anonymized where legally appropriate. State transitions require reason and audit.

### Permission model
Use RBAC for role assignment plus ABAC/resource ownership checks. Permissions are action-specific and scoped by resource/tenant where applicable. A user role alone must not grant access to another author's drafts, private messages, payment evidence or security cases.

### Session controls
Show session/device metadata only to authorized security staff and the account owner. Support revoke-one/revoke-all, forced reauthentication after sensitive changes, session expiry and suspicious-session review. Do not expose raw session tokens.

### Separation of duties
- Support: limited account and case assistance.
- Moderator: reports, comments and community safety.
- Editor: content review and publication.
- Catalog steward: metadata/duplicate decisions.
- Finance: payment and ledger operations.
- Provider operator: connector health/configuration.
- Security analyst: alerts and incident handling.
- Auditor: read-only audit access.
- Superadmin: emergency scope, step-up authentication and post-action review.

## 6. Moderation and publishing operations

Moderation case fields: report ID, target type/id, reporter, reason, evidence reference, priority, assigned reviewer, status, policy version, decision, appeal state and timestamps.

Case states: open, triaged, investigating, actioned, dismissed, escalated, appealed, closed. Preserve evidence and decision history. Do not reveal reporter identity to the reported user unless policy/legal review requires it.

Actions are proportionate: no action, warning, content hide, content removal, rate restriction, temporary suspension or ban. Permanent/high-impact actions require stronger review. Copyright claims follow a separate rights/takedown process.

Publishing review must separately verify content quality, ownership/authorization, age/content policy, metadata accuracy and cover/image rights. A moderator decision is not a copyright license, and a rights approval is not a quality approval.

## 7. Security operations and incident lifecycle

Security alert categories include authentication anomalies, credential stuffing, unusual session changes, permission escalation attempts, abusive request rates, SSRF/path probing, suspicious exports, provider compromise indicators, repeated payment callback failures and unexpected admin actions.

Incident lifecycle:
1. Alert created with source, timestamp, correlation ID and severity rationale.
2. Analyst triages and links related events.
3. Scope and affected accounts/resources are identified.
4. Containment action is selected with approval level.
5. Evidence is preserved with access controls.
6. Remediation is applied and verified.
7. Recovery is monitored.
8. Incident closes with root cause, impact, timeline and follow-up tasks.

Severity levels are provisional:
- SEV-1: active compromise, systemic data exposure or financial integrity threat.
- SEV-2: material service/security impact with limited scope.
- SEV-3: contained abuse or suspicious activity requiring investigation.
- SEV-4: informational signal or low-risk policy event.

Do not auto-ban based solely on a model score. Agents may enrich and prioritize; humans approve consequential account actions.

## 8. Agent control plane

The registry must show each agent's purpose, owner, mode, enabled state, permissions, data access, tools, schedule, last run, last success, failure rate, policy version and approval requirements.

Required specialist coverage:
- Revenue Agent: reports on revenue/ledger anomalies; cannot issue credits, refunds or change prices.
- Provider Health Agent: performs approved health checks only; cannot expand rights or activate a provider.
- Duplicate Detection Agent: proposes candidate matches; cannot merge catalog records autonomously.
- Catalog Steward Agent: identifies metadata quality and rights-review needs; cannot waive rights checks.
- Security Sentinel: detects and summarizes signals; cannot self-authorize account bans or alter security policy.
- Analytics Agent: reports on measured events and data quality; cannot fabricate missing metrics.
- Moderation Agent: queues policy-sensitive items; human reviewer decides consequential action.
- Notification Agent: sends only approved notification classes and respects user preferences.
- Omni Orchestrator: routes approved jobs to specialists; inherits the narrowest permission scope and cannot bypass approval gates.

Agent states: disabled, ready, queued, running, succeeded, partial, failed, blocked, paused_by_policy. “Ready” means configured according to a local status check, not proven accurate or autonomous.

Every run records trigger, actor/scheduler, input references, policy version, model/provider if used, tool calls, start/end, output summary, approval state, cost where known, and safe error category. Avoid storing secrets or unnecessary personal data in prompts/logs.

## 9. Analytics integrity

Admin analytics must distinguish:
- page requests from unique visitors;
- chapter requests from completed reading;
- views from engaged reading;
- clicks from conversions;
- ticket spend from author earnings;
- gross sales from net settlement;
- registered accounts from active readers;
- measured values from estimates.

Each metric defines event source, deduplication, time zone, window, exclusions and known instrumentation gaps. Late-arriving events and backfills must be disclosed. Dashboards must not imply complete analytics if instrumentation is partial.

## 10. Proposed logical APIs

These are proposed contracts, not verified existing routes:
- GET /api/v1/admin/overview
- GET /api/v1/admin/users and GET /api/v1/admin/users/:id
- POST /api/v1/admin/users/:id/restrictions
- GET /api/v1/admin/roles and PATCH /api/v1/admin/roles/:id
- GET /api/v1/admin/moderation/cases and POST /api/v1/admin/moderation/cases/:id/decision
- GET /api/v1/admin/security/alerts and POST /api/v1/admin/security/incidents
- GET /api/v1/admin/agents and GET /api/v1/admin/agents/:slug/runs
- POST /api/v1/admin/agents/:slug/run
- GET /api/v1/admin/audit-events
- GET /api/v1/admin/analytics/summary

Every write checks permission and resource scope server-side, validates state transitions, records an audit event and requires idempotency for retryable operations. High-risk operations require step-up authentication and dual approval.

## 11. Audit and configuration safety

Audit events should be append-only to ordinary operators and include actor, effective permission, action, target, timestamp, correlation ID, reason, outcome and before/after references. Audit failure must not be silently swallowed for high-risk actions: the action should fail closed or enter a safe pending state if the required audit record cannot be committed.

Feature flags require owner, purpose, rollout scope, expiry/review date and rollback plan. Separate public configuration from secrets. Maintenance mode, emergency lock and provider kill switches require reason, scope, expiry and audit. Never provide a generic UI for editing arbitrary environment variables.

## 12. Acceptance tests

1. A moderator cannot read financial evidence or change provider credentials.
2. A finance reviewer cannot grant roles or delete audit records.
3. A user cannot read another user's private support case or session metadata.
4. Every permission change is audited with actor, reason and target.
5. High-risk actions require dual approval and cannot be self-approved.
6. Audit failure blocks a high-risk state change.
7. An agent cannot execute tools outside its declared capability scope.
8. Disabling an agent prevents new runs and safely handles queued work.
9. Security Sentinel cannot auto-ban users from model output alone.
10. Agent logs redact secrets and unnecessary personal information.
11. Moderation appeals preserve original decisions and evidence.
12. Analytics labels request counts, unique users and estimates distinctly.
13. Missing metrics display “not measured”, not fabricated zeros.
14. Admin pages are noindex and inaccessible without server authorization.
15. Emergency access expires and triggers post-use review.
16. Mobile admin screens remain usable without horizontal overflow.

## 13. Reconciliation and completion boundary

Existing endpoints and agent registry provide a starting point, not proof of complete admin functionality. Before implementation, reconcile the current coarse admin role guard with the intended permission matrix, inspect actual migrations, verify all admin routes against production, test audit-write failure behavior, inspect agent execution side effects and confirm scheduled trigger configuration.

This increment specifies architecture only. No application source, production data, role, agent setting, secret, D1 migration or deployment was changed.
