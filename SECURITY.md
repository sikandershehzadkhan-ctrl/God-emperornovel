# Security Policy

Imperial Novel treats account safety, creator ownership, reader privacy, financial integrity, and content integrity as release-critical requirements.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's **Report a vulnerability** feature in the repository's Security tab (private vulnerability reporting / security advisories), when available. Do not publish exploit details, credentials, personal data, or proof-of-concept payloads in public issues.

Include:
- A concise impact description and affected route/component.
- Reproduction steps using a test account and non-production data.
- Relevant request/response details with all tokens, cookies, personal information, and secrets removed.
- Any practical mitigation that does not expose other users.

Do not access, modify, download, or retain another person's data. Stop testing once impact is demonstrated.

## Scope and priorities

The security programme prioritizes:
1. Authentication, session handling, account recovery, and privilege escalation.
2. Server-side authorization and creator/user data isolation.
3. Stored/reflected XSS, CSRF, injection, unsafe file handling, and SSRF.
4. Payment, ticket/Crown, donation, refund, and ledger integrity.
5. API abuse, resource exhaustion, scraping, spam, and denial of service.
6. Secret exposure, dependency compromise, CI/CD permissions, and deployment integrity.
7. Privacy, audit-log integrity, rights review, and private media delivery.

## Safe-harbor expectations

Good-faith testing must use accounts and resources you control, avoid service disruption, avoid social engineering and physical attacks, and stop before accessing other users' data. This policy does not authorize testing third-party infrastructure or payment providers.

## Response process

Reports are triaged for reproducibility, affected versions, exploitability, and user impact. Confirmed issues are prioritized by severity and exposure, fixed in a reviewed change, and regression-tested. A fix is not considered production protection until the release is deployed and the relevant production behavior is verified.

## Security status honesty

Automated static analysis is not a penetration test. Passing CI is not proof of security. Repository configuration cannot by itself enable account-level GitHub protections, Cloudflare WAF rules, secret scanning, 2FA enforcement, or production monitoring. Those controls require explicit owner-side configuration and verification.
