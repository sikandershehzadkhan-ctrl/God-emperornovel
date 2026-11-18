# ADR-0016: Fine-Grained Source Domain Ownership

- **Status:** Proposed
- **Date:** 2026-11-18
- **Decision owners:** Architecture contracts and engineering tooling

## Context

The root ownership audit established complete tracked-file coverage, but the ownership registry still assigned the entire `src/` tree to one broad Worker runtime owner. That was sufficient to prevent unowned files, but it did not express domain responsibility or make ownership boundaries useful for independent change review.

The current source tree contains distinct authentication, connector security, content policy, author application policy, donation policy, public catalog projection, runtime schema, route/sitemap, React community UI, and Worker composition concerns.

## Decision

Replace the broad `src/` owner with explicit source-domain ownership roots:

- Worker runtime entrypoint.
- Route registry and sitemap.
- Authentication security.
- Connector security.
- Content policy and format registry.
- Author application policy.
- Donation domain.
- Public novel projection.
- Runtime feature schema.
- Reader/community React components.

Every source owner requires an ADR or feature contract for changes. Add a build-gated test that enumerates tracked source files with Git and proves each file matches exactly one expected domain owner. A new source file must receive an owner before it can pass the governance gate. A catch-all `src/` ownership rule must not be reintroduced to bypass domain assignment.

## Boundaries

- `src/index.js` remains the Worker composition/runtime entrypoint; this decision does not split its handlers into new modules.
- The React component directory remains one owner until it has independent domain packages or clear cross-team change boundaries.
- This change does not claim that import direction or runtime dependencies are already clean. Dependency-direction analysis remains a separate architecture task.
- Existing ownership rules outside `src/` remain unchanged and may still be coarse initial boundaries.

## Validation

The source ownership test must pass in the standard build. The migration-governance workflow must verify full tracked-path ownership, overlap rejection, stale-rule rejection, and the same-PR ADR requirement.
