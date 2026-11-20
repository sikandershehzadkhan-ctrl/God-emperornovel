# ADR-0033: Ownership for API security audit evidence

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** `docs/security/`

## Context

The API authorization audit and route inventory are security-governance artifacts. They need a clear owner in the repository's fail-closed shared-surface ownership registry so future changes cannot silently bypass review.

## Decision

Assign `docs/security/` to the `security-audit-documentation` owner. This is a documentation-only ownership boundary. It does not claim that API routes are secure or that the source audit is runtime certification.

## Consequences

- All files under `docs/security/` have one registered owner.
- Factual security-evidence updates do not require a separate architecture ADR for each report revision.
- Runtime security fixes remain subject to the owners and ADR rules of their source-code paths.

## Validation

The repository ownership governance workflow checks that every tracked path has exactly one owner and rejects overlapping roots. The API inventory is a mechanical source scan and must not be interpreted as an authorization certification.
