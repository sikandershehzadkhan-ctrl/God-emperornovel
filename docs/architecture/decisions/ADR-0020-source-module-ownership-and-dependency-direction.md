# ADR-0020: Explicit source module ownership and dependency direction

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19

## Context

The repository has a Worker composition root, reusable policy modules, route/sitemap modules, runtime schema adapters, and browser React islands. Without explicit dependency boundaries, a future feature could import browser code into the Worker, make a leaf policy depend on runtime infrastructure, or introduce circular imports.

## Decision

- Maintain `docs/architecture/DOMAIN-MODULE-OWNERSHIP.json` as the explicit owner and import allowlist for every source module.
- Keep `src/index.js` as the Worker composition root.
- Keep policy modules dependency-light and independent of the Worker entrypoint.
- Allow sitemap rendering to depend on the canonical route registry, never the reverse.
- Keep React islands isolated to React/React DOM and sibling React components.
- Prevent public browser bundles from importing Worker source modules.
- Enforce complete source ownership, import allowlists, resolvable imports, and acyclic dependencies in the build.

## Consequences

- Adding a source module requires an explicit domain owner and dependency allowlist update.
- The current flat source layout remains intact; this decision establishes ownership without risky mass file moves.
- The contract verifies static dependency structure, not business correctness or runtime authorization.
