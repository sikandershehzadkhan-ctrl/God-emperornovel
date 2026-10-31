# Release 17.22.0: Author Applications

## Creator onboarding
- Reader accounts can request Author Studio access from the Author Studio route.
- Applications include a public author name, biography, optional experience and HTTPS portfolio, preferred supported formats, and a short original or authorized writing sample.
- Applicants can check pending/rejected status and see review feedback.
- Admins have a dedicated application queue. Approval promotes an active, non-banned reader to the author role; rejection requires useful feedback.
- Author access does not bypass novel/chapter rights review or publication approval.

## Safeguards
- One pending application per account, enforced by a partial unique D1 index.
- Maximum three applications per user in a rolling 30-day window.
- Server-side validation for sample length, biography, portfolio URL, formats and rights confirmation.
- Admin decisions are audited and applicants receive notifications.

## Database and validation
- Adds migration 0011_author_applications.sql.
- Adds policy, UI, admin-script and SQLite schema regression tests.
- Release assets, PWA manifest, service worker and Worker APP_VERSION are aligned to 17.22.0.

**Deployment:** source-only release. Production deployment and D1 migration remain pending the reviewed Cloudflare production workflow.