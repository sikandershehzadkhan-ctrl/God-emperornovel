# ADR-0024: Keep Literal and Dynamic API Route Inventories Disjoint

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** API architecture and engineering governance

## Context

The route inventory baseline included two trailing-slash API prefixes as literal paths even though the dedicated API inventory correctly classified them as dynamic prefix matchers. This caused the baseline to report 76 literal API paths while the canonical API inventory reported 74, creating duplicate and inconsistent route counts.

## Decision

The route baseline's literal API path list must exactly match the dedicated API endpoint inventory. Prefix matchers and parameterized paths remain in the dynamic endpoint family inventory and must not be duplicated as literal paths.

## Validation

The route inventory baseline test compares the complete sorted literal path sets. The dedicated API inventory test continues to verify literal and dynamic source evidence against the Worker handler.
