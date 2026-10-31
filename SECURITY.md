# Imperial Novel Security Policy

## Security baseline

Every Worker response must pass through the shared response-hardening function. The baseline includes HSTS, MIME sniffing protection, same-origin framing protection, a restrictive referrer policy, a restrictive permissions policy, cross-domain policy denial, download hardening, DNS-prefetch control, Origin-Agent-Cluster, and Cross-Origin-Opener-Policy.

HTML responses currently use a Content Security Policy that still permits inline scripts and styles for frontend compatibility. Do not remove those allowances until the frontend is migrated to nonces or external assets and compatibility tests pass. A future hardening change should add object-src 'none', base-uri 'self', and form-action 'self'.

## Release requirements

- Run the complete npm run build test suite.
- Review dependency and secret-scanning alerts before release.
- Keep payment webhooks disabled until provider-specific signature verification, amount and currency checks, event identity, and replay protection are implemented and tested.
- Require authorization checks on every private resource and administrative operation.
- Keep uploads private by default; validate file types from bytes, enforce size limits, use random object keys, and quarantine or scan before publication.
- Never store API keys, session tokens, payment secrets, or private user data in source control or logs.
- Apply D1 migrations before deploying Worker code that depends on them.
- Do not merge or deploy solely because a static test passes. Review the diff, run the full suite, and perform authenticated and unauthenticated smoke tests.

## Incident response

If compromise is suspected, disable affected credentials, rotate secrets, revoke active sessions, preserve logs, isolate affected routes or storage, assess data exposure, patch and test, then restore service with monitoring. Notify affected users and follow applicable legal obligations.

## Reporting

Do not publish exploit details or user data in public issues. Report suspected vulnerabilities privately to the repository owner.