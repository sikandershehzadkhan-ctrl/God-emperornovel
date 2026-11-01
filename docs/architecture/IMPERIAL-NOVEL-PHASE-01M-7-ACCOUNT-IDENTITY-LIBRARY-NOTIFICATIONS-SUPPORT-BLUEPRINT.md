# Imperial Novel | Phase 01M.7: Account, Identity, Library, Notifications & Support

**Brand:** Read • Create • Conquer  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture specification only.

## 1. Purpose and trust model

This phase defines the signed-in reader's account, identity, security, library, reading history, notification and support journeys.

- Account identity, public profile, reading preferences and private activity are distinct data domains.
- Users own and control their library preferences and notification choices, subject to necessary security and legal records.
- Private reading history, bookmarks, reading positions, conversations and support cases are never public by default.
- A successful login is not proof that an email address is verified.
- A public profile must never expose email, private history, payment references, session metadata or moderation reports.
- Session and account security actions require reauthentication where risk warrants it.
- Do not claim account recovery, MFA, verification email delivery or device management exists until implemented and tested.

## 2. Repository evidence (read-only)

Inspection of feature-branch `src/index.js` found:
- `POST /api/auth/register` validates username/email/password and applies an IP-based registration rate limit.
- `POST /api/auth/login` applies IP and email rate limits and verifies password credentials.
- `POST /api/auth/logout` deletes the current session by token hash and clears the session cookie.
- `GET /api/me` returns the current session user's basic account fields.
- `GET /api/profile` returns account information and aggregate counts for history, follows, unlocks and ledger activity.
- `GET/POST /api/history` read and update the signed-in user's reading history.
- `GET/POST /api/reading-position` read and update a user's chapter progress percentage.
- `GET /api/bookmarks` and `POST /api/bookmark` provide bookmark operations.
- `GET /api/notifications` returns the current user's recent notifications; `POST /api/notifications/read` marks unread notifications as read.
- These handlers require authentication and scope the listed data by the authenticated user.
- No complete password-reset, email-verification delivery, MFA, trusted-device, account export/deletion or user-facing support-case lifecycle was verified in this inspection.

This is feature-branch source inspection, not proof of production parity. No account was accessed, no email sent and no user data changed.

## 3. Account and identity screen registry

| ID | Route proposal | Screen | Access |
|---|---|---|---|
| ACC-001 | /account | Account overview | Owner |
| ACC-002 | /account/profile | Public profile editor | Owner |
| ACC-003 | /account/security | Security overview | Owner |
| ACC-004 | /account/security/password | Change password | Owner + reauthentication |
| ACC-005 | /account/security/sessions | Active sessions/devices | Owner |
| ACC-006 | /account/security/verification | Email verification status | Owner |
| ACC-007 | /account/security/recovery | Recovery methods | Owner |
| ACC-008 | /account/preferences | General preferences | Owner |
| ACC-009 | /account/preferences/reading | Reading preferences | Owner |
| ACC-010 | /account/preferences/notifications | Notification preferences | Owner |
| ACC-011 | /account/privacy | Privacy controls | Owner |
| ACC-012 | /account/privacy/export | Data export request | Owner |
| ACC-013 | /account/privacy/delete | Account deletion request | Owner + reauthentication |
| ACC-014 | /account/connected-apps | Connected services | Owner |
| ACC-015 | /account/blocked-users | Blocked users | Owner |
| ACC-016 | /account/activity | Private account activity | Owner |

Public identity routes:
- `/u/:username`: public profile, only explicitly public fields.
- `/u/:username/stories`: published works only.
- `/u/:username/followers` and `/u/:username/following`: visible only where user privacy settings permit.

Do not expose internal numeric IDs in public URLs as an authorization mechanism. Public profile slugs must be normalized, unique and safely encoded.

## 4. Authentication and recovery journeys

### Registration
Collect only required fields. Validate username, email and password on the server. Explain password requirements before submission. Rate-limit by account/IP and protect against account enumeration. Do not promise verification delivery unless a real mail provider is configured and tested.

### Login and logout
Use generic invalid-credential errors. Session cookies must be Secure, HttpOnly and appropriately SameSite. Rotate session identifiers after authentication and privilege changes. Logout invalidates the server-side session, not only the browser UI.

### Password change and reset
Proposed flow: request reset → generic response → short-lived single-use token delivered through verified channel → token validation → password update → revoke other sessions → notify account owner. Store only token hashes. Rate-limit issuance and redemption. Never send passwords by email or reveal whether an email exists.

### Email verification
Verification token is random, single-use, time-limited and stored hashed. Verification state is distinct from role and account status. Changing email requires confirmation of the new address and risk checks. Do not mark an account verified merely because a user supplied an email.

### MFA and recovery
MFA is a future capability until an authenticator/recovery design is implemented. Recovery codes are displayed once and stored hashed. Support staff must not bypass MFA based only on a chat request. High-risk recovery requires identity proofing proportionate to the risk and an audit trail.

## 5. Library and reading continuity

| ID | Route proposal | Screen |
|---|---|---|
| LIB-001 | /library | Personal library |
| LIB-002 | /library/bookmarks | Bookmarked stories/chapters |
| LIB-003 | /library/history | Reading history |
| LIB-004 | /library/continue | Continue reading |
| LIB-005 | /library/collections | User collections |
| LIB-006 | /library/collections/:id | Collection detail |
| LIB-007 | /library/downloads | Offline items, only if supported |
| LIB-008 | /library/reading-stats | Personal reading summary |

Library rules:
- Reading position is per user, novel and chapter; server validates that the chapter is published and accessible.
- Synchronization uses updated timestamps and conflict policy. A stale device must not overwrite a newer position without resolution.
- Continue-reading uses the most recent valid position, not a guessed chapter.
- Bookmarks are private unless explicitly shared.
- Collections are private by default. Sharing is opt-in and revocable.
- Offline download is not promised until encrypted storage, rights checks, expiry/revocation and device cleanup are implemented.
- Do not expose private reading history to authors or advertisers. Aggregated analytics must follow privacy policy and data minimization.

## 6. Notifications

| ID | Route | Screen |
|---|---|---|
| NTF-001 | /notifications | Notification center |
| NTF-002 | /notifications/preferences | Notification settings |
| NTF-003 | /notifications/:id | Notification detail/action |
| NTF-004 | /notifications/mentions | Mentions and replies |
| NTF-005 | /notifications/system | Security and account notices |

Notification categories:
- security and account changes;
- author application and publishing workflow;
- followed-author/story updates;
- replies, mentions and community activity;
- payment and Crown transaction status;
- support case status;
- platform/service announcements.

Delivery channels are separate: in-app, email, push and other channels only when implemented and consented/authorized. A notification is not the source of truth; it links to a persisted resource and current status. Mark-read actions must be owner-scoped and idempotent. Batch marking must not mark notifications belonging to another user.

Do not send promotional messages through security or transaction categories. Respect preferences, quiet hours and applicable communication law. Critical security notices cannot be disabled where necessary, but their scope must remain narrow.

## 7. Support and help screen registry

| ID | Route | Screen |
|---|---|---|
| SUP-001 | /help | Help center |
| SUP-002 | /help/search | Help article search |
| SUP-003 | /help/article/:slug | Help article |
| SUP-004 | /help/contact | Contact/support entry |
| SUP-005 | /support | User support cases |
| SUP-006 | /support/new | Create support case |
| SUP-007 | /support/:caseId | Case detail and replies |
| SUP-008 | /support/:caseId/attachments | Case attachments |
| SUP-009 | /support/appeals | Appeals overview |
| SUP-010 | /support/appeals/:appealId | Appeal detail |

Case categories: account/security, reading/access, author/publishing, copyright/rights, payment/Crowns, community safety, bug/report and privacy request.

Support cases:
- have owner, category, priority, status, assigned team and timestamps;
- expose only necessary fields to the assigned support role;
- restrict attachments by size/type and scan before staff download;
- warn users not to submit passwords, full payment-card data or authentication codes;
- preserve messages and decisions according to retention policy;
- support escalation, reopen and closure with reason;
- distinguish a support case from a formal copyright takedown, payment dispute or privacy request where separate procedures apply.

## 8. Proposed API contracts

Logical proposals only:
- POST /api/v1/auth/password-reset-requests
- POST /api/v1/auth/password-reset
- POST /api/v1/auth/email-verification
- POST /api/v1/auth/email-verification/confirm
- GET /api/v1/me/sessions and DELETE /api/v1/me/sessions/:id
- GET/PATCH /api/v1/me/preferences
- GET /api/v1/me/library and GET /api/v1/me/reading-history
- GET/POST /api/v1/me/collections
- GET /api/v1/me/notifications and POST /api/v1/me/notifications/:id/read
- GET/PATCH /api/v1/me/notification-preferences
- POST /api/v1/support/cases and GET /api/v1/support/cases/:id
- POST /api/v1/privacy/requests

Every private resource lookup must enforce owner/assigned-role access server-side. Avoid insecure direct-object references. Responses must not disclose whether another user's email or account exists.

## 9. Privacy, retention and account lifecycle

Account deletion is a workflow, not a single cascade delete:
1. Reauthenticate and confirm intent.
2. Explain impact on profile, drafts, published works, comments, purchases, Crown ledger and legal records.
3. Offer export before deletion where available.
4. Apply cooling-off period only if legally/policy approved and disclose it.
5. Remove or anonymize data that can lawfully be removed.
6. Preserve narrowly required financial/audit records under restricted access and disclosed retention.
7. Transfer, unpublish or otherwise resolve authored works according to rights, terms and author choice.
8. Revoke sessions and connected credentials.
9. Confirm completion and explain any retained categories.

Do not silently delete co-authored content, community evidence or financial records without policy/legal handling. Data export must be scoped to the requester and delivered securely with expiry.

## 10. Acceptance tests

1. User A cannot access User B's history, bookmarks, sessions, notifications or support case.
2. Password reset responses do not reveal account existence.
3. Expired/reused reset and verification tokens are rejected.
4. Password change revokes sessions according to policy and notifies the owner.
5. Logout invalidates the server session.
6. Public profile excludes email and private activity.
7. Reading progress cannot reference unpublished or inaccessible chapters.
8. Stale-device sync cannot silently overwrite a newer reading position.
9. Notification actions affect only the authenticated user's records.
10. Security notices are distinct from promotional notifications.
11. Support attachments are validated and access-controlled.
12. Account deletion explains retained legal/financial records before confirmation.
13. Data export is owner-scoped, time-limited and audited.
14. All account, support and privacy screens have loading, empty, error, forbidden and recovery states.
15. Critical journeys are keyboard and screen-reader operable on mobile and desktop.

## 11. Completion boundary

Account, identity, library, notification and support screen architecture is specified. Existing auth/history/bookmark/reading-position/notification endpoints provide a partial implementation baseline. Password recovery, verification delivery, MFA, device management, privacy export/deletion and support case lifecycle are not verified as operational. No account, user data, email, application code, D1 schema or deployment was changed.
