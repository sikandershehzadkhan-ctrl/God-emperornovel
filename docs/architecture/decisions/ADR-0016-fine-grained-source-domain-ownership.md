# ADR-0016: Fine-Grained Source Domain Ownership

- **Status:** Proposed
- **Date:** 2026-11-20
- **Decision owners:** Platform architecture and engineering tooling

## Context

The canonical ownership registry previously assigned all of `src/` to one Worker runtime owner. That guaranteed path coverage but did not make domain responsibility or dependency direction enforceable. The current mainline contains 18 source files spanning route/crawl policy, authentication, connector security, publishing policy, author eligibility, donations, public-content projection, runtime schema, React reader/community components, and the Worker composition root.

## Decision

Replace the broad `src/` catch-all with ten explicit ownership groups: Worker composition root, route and sitemap, authentication security, connector security, content policy, author application policy, donation domain, public novel projection, runtime schema, and reader/community React components.

The Worker composition root may depend on domain policy modules. Domain policy modules must not depend on the Worker composition root. Engineering tooling may import the source domains it validates. The route/sitemap modules remain one domain because their source imports are internal to that group.

Every source file must have exactly one named owner. Every source owner requires an ADR or feature contract for changes. The build-gated source ownership test enumerates tracked files and rejects broad catch-all ownership, missing owners, multiple owners, and unclassified new source files.

## Boundaries

- `src/index.js` remains the composition root. This ADR does not extract its handlers into new modules.
- The React island directory remains one owner until its module boundaries are independently justified.
- Import direction is enforced by the canonical ownership validator; this ADR does not claim live Worker or D1 certification.
- No runtime behavior, schema, production data, or deployment configuration is changed.

## Validation

The source-domain ownership test runs in the standard build. Migration Governance additionally checks complete repository path ownership, dependency direction, stale rules, cycles, and same-PR decision evidence.
