# Imperial Novel: Data Protection and Privacy Security Architecture

Status: architecture specification; not evidence of implemented controls or a security certification.
Scope: all readers, authors, owner, optional future delegated operators, services, integrations and stored data.

## Non-negotiable security objectives
- Confidentiality: users and services see only data they are authorized to see.
- Integrity: only authorized, validated actions can create, change, publish or delete records.
- Availability: abuse, traffic spikes or optional-service failures must not unnecessarily prevent reading.
- Accountability: privileged and sensitive actions are attributable, time-stamped and reviewable.
- Data minimization: collect the least data needed, retain it only as long as justified, and avoid copying it into logs or analytics.
- Honest status: a control is not complete until implemented, tested and verified in the deployed environment.

## Threat model
Assume attackers may be anonymous visitors, registered users, compromised accounts, malicious authors, abusive moderators, compromised third-party providers, automated bots, or someone with a leaked URL/token. Consider accidental operator mistakes and software supply-chain compromise too. Treat all client input, browser state, URL parameters, uploaded files, external metadata and AI/provider output as untrusted.

## Data classification and handling
| Class | Examples | Required handling |
|---|---|---|
| Public | Published novels, public profiles, public comments | Publish only after explicit publication workflow; validate output and cache only public versions |
| Personal | Email, username, profile settings, follows | Private by default where appropriate; owner-scoped access; minimize exposure in APIs |
| Sensitive personal | Reading history, library, reading position, private reports, account recovery data | Strict owner-only authorization; never shared-cache; redact from logs and analytics |
| Confidential creator | Drafts, unpublished chapters, private notes, submission materials | Author/explicit collaborator access only; no public indexing or provider sharing by default |
| Financial/security | Payment references, ticket ledger, session secrets, password hashes, recovery tokens | Narrow service access; never expose secrets; immutable ledger/audit trail; strong retention and rotation rules |
| Operational secrets | API keys, signing keys, database credentials | Secret manager/environment bindings only; never source code, client bundles, logs or public repository |

## Identity, authentication and sessions
- Store passwords only with a modern, deliberately configured password-hashing scheme; never reversible encryption or plaintext.
- Use secure password reset with short-lived, single-use, purpose-bound tokens; do not reveal whether an email/account exists.
- Require verified ownership for sensitive email changes, password changes, payout changes and account recovery.
- Use secure, HttpOnly, SameSite cookies over HTTPS; rotate session identifiers after login, privilege changes and recovery; expire and revoke sessions.
- Provide session/device review and revoke-all-sessions after suspected compromise; notify the account owner of important security changes.
- Add rate limits and risk controls to login, registration, reset, verification and recovery; use bot challenges proportionately.
- Offer MFA, preferably passkeys/WebAuthn where supported, with carefully protected recovery codes and recovery procedures.
- Never trust a role, user ID, ownership flag or permission supplied by the browser.

## Authorization and tenant isolation
- Deny by default. Authorize every API operation on the server, for every request, not merely by hiding buttons or routes.
- Derive the acting identity from the authenticated server-side session. Compare it with the target resource owner and explicit grants.
- Enforce object-level authorization on every identifier: profile, draft, chapter, comment, library item, history row, ticket, report, upload and notification.
- Use explicit ownership relationships and scoped grants for collaboration. No implicit access because two users follow each other or share a role.
- Separate platform-owner authority from ordinary user accounts. Privileged access must be explicit, minimal, protected by MFA and audited.
- Prevent privilege escalation: users cannot self-assign roles, verify themselves, unban themselves, grant collaborators or alter authorization fields.
- Apply authorization consistently to HTML routes, APIs, exports, search, background jobs, websocket/realtime channels, object storage and support tooling.
- Use non-enumerable identifiers where appropriate, but never treat hard-to-guess IDs as authorization.

## User-to-user interference protections
- Profile edits, account settings, email, credentials, library, history, reading position and private drafts are owner-only.
- Authors control their own drafts and works; collaborator permissions must be explicit, scoped, revocable and logged.
- Public comments/reviews/follows are limited to their defined actions; users cannot edit or delete another person's content except through authorized moderation workflow.
- Block and mute rules must apply across all contact surfaces, including comments, mentions, follows, invitations, notifications and future messaging; define narrow safety/moderation exceptions.
- Prevent stalking through private reading activity, online status, hidden libraries, private follows or precise activity timestamps.
- Protect against IDOR/BOLA, mass assignment, CSRF, XSS, injection, SSRF, open redirects, request smuggling, replay, race conditions and insecure direct file access.
- Rate-limit and detect spam, fake engagement, review brigading, follow/unfollow abuse, report brigading and notification harassment.
- Keep moderation actions distinct from account ownership; require reason codes, scope limits, audit events and appeal paths.

## Storage, encryption and secrets
- Enforce HTTPS/TLS in transit. Encrypt sensitive data at rest using provider-supported controls and managed keys; document which layers are encrypted.
- Hash passwords with a suitable password-hashing algorithm and parameters; use keyed hashes or encryption only where retrieval is genuinely required.
- Store secrets in Cloudflare secrets/bindings or an approved secret manager, never in source, frontend variables, ZIPs, commits or error messages.
- Restrict database credentials and service bindings to least privilege; separate production and non-production environments and data.
- Use private object storage for drafts, reports and personal uploads; issue short-lived, scoped download URLs only after authorization.
- Validate uploads by content, size and type; randomize storage keys; quarantine and scan where feasible; prevent executable serving and path traversal.
- Do not put sensitive data in URLs, analytics events, cache keys visible to clients, exception messages or logs.

## API, browser and application security
- Validate request schemas, types, lengths, enums and business invariants on the server; reject unknown sensitive fields.
- Use parameterized database queries; escape output by context; apply a restrictive Content Security Policy and security headers.
- Protect cookie-authenticated state changes against CSRF; configure CORS narrowly and never use wildcard credentialed origins.
- Apply request/body limits, pagination caps, timeouts, per-account and per-IP rate limits, and abuse budgets.
- Use idempotency keys for payment callbacks and other retryable financial mutations; verify provider signatures and reconcile uncertain outcomes.
- Keep public caches separate from private responses. Never shared-cache account, library, history, draft, payment, session or personalized data.
- Return generic errors to clients while preserving sanitized diagnostic details in restricted logs.

## Privacy lifecycle and user rights
- Publish a clear privacy notice describing collection, purpose, sharing, retention, deletion and contact/complaint channels.
- Collect minimal profile and telemetry fields; do not collect precise location or sensitive attributes without a necessary, disclosed purpose.
- Define retention periods for accounts, drafts, logs, payment records, reports, backups and security events; legal/financial retention exceptions must be documented.
- Support account data access/export, correction and deletion workflows, with identity verification and safeguards against deleting another user's data.
- Deletion must propagate to derived stores and integrations where applicable; backups expire under a documented schedule and are not silently treated as immediately erased.
- Do not send private drafts, personal reading histories or account records to AI or external providers without a specific lawful purpose, disclosure and user-authorized feature.
- Keep analytics aggregated or pseudonymized where possible; never expose raw personal activity on public dashboards.

## Monitoring, incident response and recovery
- Log security-relevant events: login failures, recovery, session revocation, permission denials, role/grant changes, exports, sensitive reads where justified, moderation and payment state changes.
- Never log passwords, tokens, full payment credentials, private message bodies or unnecessary personal content.
- Alert on unusual login patterns, credential stuffing, mass exports, high denial rates, privilege changes, suspicious upload patterns and abnormal data reads.
- Define incident severity, containment, credential/key rotation, session revocation, evidence preservation, user/regulator notification assessment and post-incident review.
- Maintain encrypted backups, restricted backup access, restore drills, integrity checks, recovery objectives and a tested rollback process.
- Provide kill switches for risky integrations and nonessential features; reading should remain available when AI, recommendations, analytics or external providers fail.

## Third-party, AI and automation boundaries
- Inventory every provider, data field shared, purpose, region, retention behavior, credentials and failure mode before enabling integration.
- Keep OmniPortal connectors disabled until rights, security and data-sharing review is approved. Metadata-first ingestion does not authorize chapter-body copying.
- Treat external provider responses and AI outputs as untrusted data; prevent prompt injection from granting tools access to secrets or private user data.
- Give each automation a narrow service identity, limited scopes, quotas and audit trail. No agent receives blanket access to all accounts.
- Require human approval for destructive, financial, rights-sensitive or privilege-changing actions.

## Security verification matrix
| Test family | Required negative tests |
|---|---|
| Object ownership | User A cannot read/update/delete User B's profile, draft, chapter, library, history, ticket or report by changing IDs |
| Role boundaries | Reader cannot grant roles; author cannot moderate globally; moderator cannot access unrelated private drafts; service identity cannot become owner |
| Sessions | Expired/revoked/replayed tokens fail; session rotates after privilege change; reset token is single-use |
| Browser/API | CSRF, XSS, injection, mass assignment, CORS and open-redirect tests fail safely |
| Privacy | Private data absent from public APIs, search indexes, shared caches, logs, analytics and sitemaps |
| Uploads | Oversized, spoofed, malformed, executable and unauthorized files are rejected or quarantined |
| Payments | Forged, duplicated, replayed and out-of-order callbacks never double-credit; uncertain outcomes remain pending |
| Abuse | Block evasion, spam, harassment, brigading and notification floods are rate-limited and observable |
| Recovery | Restore drills verify integrity, access controls, documented recovery objectives and key rotation |
| Resilience | Dependency outage and traffic spike do not expose data or corrupt account/payment state |

## Release gates
1. Threat model and data inventory reviewed.
2. Every sensitive route and API has server-side authorization tests.
3. Cross-user isolation tests pass for all user-owned resources.
4. Secrets scan and dependency/security checks pass; no known critical/high unresolved issue without explicit risk acceptance.
5. Privacy, retention, deletion, backup and incident procedures are documented and exercised.
6. Production configuration, HTTPS, cookies, CORS, CSP, rate limits, storage permissions and logs are verified.
7. Independent security review/penetration testing is completed before broad public launch where feasible.
8. Findings are tracked to closure; controls are re-tested after material changes.

## Implementation status and limitations
This document defines required architecture and tests. It does not assert that any control is currently implemented, that the deployed site is secure, or that data theft is impossible. The repository and live deployment must be audited, controls implemented, and tests run before launch clearance.

## Related architecture
- `IMPERIAL-MASTER-ROUTE-REGISTRY-01N.md`
- `IMPERIAL-MASTER-ROUTE-REGISTRY-01N.json`
- `IMPERIAL-ROUTE-NAVIGATION-COVERAGE-AUDIT-01N-2.md`
- `IMPERIAL-SOLO-OWNER-AND-SCALABILITY-BLUEPRINT-01N-4.md`