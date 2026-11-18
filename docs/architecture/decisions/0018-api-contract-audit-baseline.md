# ADR-0018: API contract audit baseline

- Status: Accepted as an audit process and evidence boundary
- Date: 2026-11-18

## Context

The API endpoint inventory identifies literal Worker routes and dynamic route families, but it deliberately does not certify method semantics, authentication, authorization, or resource ownership. Treating nearby helper names or explicit method predicates as complete contracts would create false security confidence.

The source review also confirmed that the current rating write handler and public client formatter use a 1–5 scale, while the product requirement is a whole-number 1–10 scale.

## Decision

Maintain a separate API contract audit baseline that:

- distinguishes observed source evidence from verified contract behavior;
- keeps unknown method/auth/resource fields explicitly unverified;
- records concrete mismatches without silently changing unrelated behavior;
- requires method, authentication, role, resource-scope, validation, side-effect, response, client-call-site, and test evidence for each operation;
- sequences remediation only after the complete handler and client path have been traced.

The 1–10 rating mismatch is recorded as a confirmed follow-up, not fixed in this audit-baseline change. A coordinated migration and client/API update must be reviewed as its own change.

## Consequences

- API security and completeness cannot be declared finished from the existing route inventory.
- The inventory remains a source-path index, not the authoritative API contract.
- Cross-account tests and method-negative tests become required evidence for applicable operations.
- Production deployment and live D1 testing remain separate release activities.

## Alternatives considered

- Infer contracts from route names and helper-signal proximity: rejected because this does not prove actual control flow or resource ownership.
- Rewrite the entire API dispatcher before auditing it: rejected because it would combine discovery, behavior changes, and security remediation into one difficult-to-review change.
