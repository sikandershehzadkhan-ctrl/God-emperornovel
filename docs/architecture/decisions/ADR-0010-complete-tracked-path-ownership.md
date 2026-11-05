# ADR-0010: Complete Tracked-Path Ownership Coverage

**Status:** Proposed  
**Date:** 2026-11-04  
**Decision owners:** Platform architecture and repository governance

## Context

The first ownership registry covered only selected high-collision paths. A fail-closed changed-path check would correctly reject newly changed unregistered paths, but it would also reveal that many existing tracked files had never been assigned an owner. The registry also needed to distinguish code and operational surfaces that require an architecture decision from reference material and archival deployment artifacts.

## Decision

1. The ownership registry covers every tracked file in the repository, with exactly one owner per path.
2. CI audits both the complete tracked-file inventory and the PR's changed-file inventory. Missing and ambiguous ownership fail closed.
3. Each owner declares whether a changed path requires an ADR or feature contract. Runtime, schema, build, CI, architecture, and tooling surfaces require one; reference documentation and archival root artifacts do not.
4. Directory-level ownership is an initial domain boundary, not a claim that every file in that directory is one module. Split ownership into narrower non-overlapping paths when independent module boundaries are established.
5. Newly introduced files must be registered in the same PR before the ownership gate can pass.

## Consequences

The registry is now a repository-wide inventory rather than a short list of selected paths. New files cannot silently fall outside governance. Documentation and archival trigger changes remain practical without requiring an ADR for every editorial adjustment, while critical shared surfaces retain decision-record requirements.

## Verification

The ownership validator checks exact-one ownership for every tracked path, exact-one ownership for every changed path, non-overlapping ownership roots, and ADR/feature-contract presence for decision-required changes.
