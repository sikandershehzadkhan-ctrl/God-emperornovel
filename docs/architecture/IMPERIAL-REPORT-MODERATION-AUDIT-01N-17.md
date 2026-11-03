# Imperial Novel Phase 01N.17: Report Moderation and Audit Trail

**Scope:** make both generic content reports and comment reports reviewable through administrator-only API routes, with validated status transitions and audit events.  
**Production impact:** none from this work session. Changes are on `architecture/phase-01n-master-route-registry`; no Worker deployment or live D1 operation was performed.

## Findings

- The admin API exposed a queue and status update for generic `reports`, but the update did not verify that a row existed and did not create an audit event.
- Reader comment reports were stored in `comment_reports`, but there was no corresponding administrator queue or moderation endpoint in the inspected dispatcher.
- The admin UI's existing reports tab should not be assumed to display comment reports until its client integration is separately implemented and tested.

## Changes committed

1. Added `GET /api/admin/comment-reports`.
   - Administrator-only.
   - Returns up to 200 newest/open-first reports.
   - Includes reporter username, comment body/status, and parent novel context.
   - Uses left joins so orphaned comment references remain visible for investigation rather than disappearing from the queue.

2. Added `PATCH /api/admin/comment-reports/:id`.
   - Administrator-only.
   - Accepts only `open`, `reviewing`, `resolved`, or `dismissed`.
   - Validates a positive safe-integer ID.
   - Returns 404 if no report row was updated.
   - Writes an audit event after a successful state change.

3. Hardened generic report moderation.
   - The existing PATCH now checks the affected-row count and returns 404 for an unknown report.
   - Successful changes are recorded in the audit log.
   - Queue ordering prioritizes open, then reviewing, then completed states.

4. Added `scripts/test-admin-report-moderation.mjs` and wired it into the build validation chain.

## Remaining verification

- The new source-policy test has been added but has **not** been executed.
- No end-to-end administrator session test has been run.
- No D1 integration test has verified behavior with orphaned comment/user/novel references.
- The admin page still needs a dedicated comment-report panel or a deliberate combined queue UI.
- Review metadata columns (reviewer ID and review timestamp) are not yet stored on each report row; the audit log is the current record of who changed status.
- Orphan cleanup is intentionally not automated. Reports should be retained for moderation/audit rather than silently deleted.
