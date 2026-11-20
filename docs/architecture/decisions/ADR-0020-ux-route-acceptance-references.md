# ADR-0020: Maintain UX and route acceptance references alongside canonical registries

**Status:** Accepted for the canonical integration candidate  
**Date:** 5 November 2026

## Context

The older UX acceptance PR contains useful cross-platform design, accessibility, localization, responsive, resilience, and screen-state criteria. Its route-to-screen matrix is also useful as an acceptance checklist. However, it was authored against historical route and responsive-spec artifacts, and its separate migration note contains branch-local migration numbers and account findings that are no longer a safe source of current truth.

## Decision

1. Preserve the UX and route-to-screen criteria as dated architecture references.
2. Treat the current machine-readable route registry, Worker route map, authorization ownership matrix, API method matrix, design tokens, and feature contracts as authoritative.
3. Treat the route table as a checklist, not proof that every route exists or has a dedicated working screen.
4. Require exact-source, role, state, accessibility, responsive, RTL, and runtime evidence before marking a screen complete.
5. Do not carry forward stale migration-number claims; use the canonical legacy-schema rebuild safety plan for migration governance.

## Consequences

- Product and QA teams retain the detailed acceptance criteria without making historical route names authoritative.
- Route mismatches must be reconciled against the canonical registry before runtime changes.
- No runtime code, schema, migration, production D1 resource, or deployment configuration is changed by this decision.

## Validation

The exact documentation PR head must pass architecture ownership, migration governance, route registry, runtime schema parity, Cloudflare source validation, and Graphify checks.
