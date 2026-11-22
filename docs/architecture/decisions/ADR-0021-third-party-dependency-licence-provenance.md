# ADR-0021: Enforce third-party dependency licence and provenance checks

- **Status:** Proposed
- **Date:** 2026-11-22
- **Decision owners:** Build toolchain and engineering tooling

## Context

Imperial Novel is adopting a deliberate open-source reuse policy. The current npm lockfile is small, but future editor, reader, accessibility, search, and analytics candidates can introduce transitive dependencies, licence obligations, non-registry sources, or paid-service requirements. Manual review alone is easy to forget.

## Decision

Add a dependency-free Node.js policy check that reads the existing package manifest and npm lockfile. Run it before the normal build checks. Require exact direct-dependency version agreement, licence metadata for every locked package, a reviewed permissive SPDX allowlist, and public npm registry provenance for resolved packages.

The check is intentionally conservative. Unlisted or compound licence expressions fail closed and require explicit manual review before the allowlist is changed. The policy does not replace inspection of actual licence texts, notices, assets, or legal obligations.

## Consequences

- New dependency adoption becomes visible in normal CI.
- The existing lockfile remains the source of exact package versions and integrity metadata.
- No new runtime or build dependency is introduced by the checker.
- A package with an unknown licence or unreviewed source cannot silently enter the approved build.
- The check must be updated through a reviewed policy change when a legitimate new licence is approved.
