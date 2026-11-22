# ADR-0020: Govern third-party open-source integration

- **Status:** Proposed
- **Date:** 2026-11-22
- **Decision owners:** Platform architecture and repository maintainer

## Context

Imperial Novel needs proven open-source capabilities, but its production architecture is a Cloudflare Workers application with D1, a vanilla-JavaScript application, React islands, versioned same-origin assets, and a zero-budget operating constraint. Blindly copying applications or adding dependencies can introduce licence obligations, incompatible runtimes, security risks, bundle growth, new hosting costs, and ownership collisions.

The first open-source research documents are reference material. They do not change runtime behavior, but the canonical ownership registry requires every tracked path to have exactly one owner.

## Decision

1. Assign the open-source integration register and its Author Studio pilot/spike documents to the existing documentation-reference owner.
2. Keep the broader candidate catalog under the existing governance-documentation root.
3. Require exact-version licence and transitive-dependency review before any package or source code is adopted.
4. Prefer permissive licences, but do not treat a repository's top-level licence as proof that every asset, extension, model, font, dataset, or transitive dependency has the same licence.
5. Preserve the Cloudflare Workers + D1 architecture, same-origin versioned assets, existing authorization and rights controls, and zero-budget operating constraint.
6. Require isolated implementation branches, generated lockfiles, reproducible installs, existing CI checks, and measured mobile impact before adoption.
7. Do not copy creative works, platform user data, credentials, or application backends from reference projects.
8. No production deployment or D1 mutation is authorized by this decision.

## Consequences

- Candidate discovery is separated from approval and integration.
- Documentation paths are explicitly owned and governance remains fail-closed.
- Dependency adoption must be justified by measurable product value and verifiable evidence.
- Candidates requiring paid hosting, proprietary services, or incompatible licences remain research-only or are rejected.
