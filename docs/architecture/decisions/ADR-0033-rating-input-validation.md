# ADR-0033: Strict whole-number rating input

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Catalog and platform kernel

## Context

The canonical Worker already validates that both the novel ID and raw rating are safe integers, with ratings in the 1–10 range. It then redundantly applies `Math.round` to the already validated integer. The prior main-targeted PR #209 used an older 1–5 contract and is stale relative to the canonical 1–10 product rule.

## Decision

1. Preserve the canonical 1–10 rating range.
2. Parse the rating once and validate it directly with `Number.isSafeInteger`.
3. Remove rounding so fractional values cannot be normalized into a valid rating.
4. Keep the authenticated owner binding, publication-state check and rights-eligibility check unchanged.
5. Add a mandatory build regression covering valid 1–10 integers and malformed, fractional, non-finite, string, null, missing and out-of-range values.

## Consequences

No migration, route addition, response shape, UI asset or stored data change is required. PR #209 is superseded because its 1–5 range does not match the canonical 1–10 schema and Worker contract.
