# ADR-0021: Validate ownership registry entries in both directions

- **Status:** Proposed
- **Date:** 2026-11-20
- **Owners:** Architecture governance and engineering tooling

## Context

The ownership validator checks that every tracked file has exactly one owner, but coverage-only validation does not reject stale exact-file entries or directory roots that contain no tracked files. A stale path can therefore remain in the registry after its target is removed. The current registry contains an exact `ARCHITECTURE.md` entry although that path is not tracked.

## Decision

Ownership validation must be bidirectional:

1. Every tracked path matches exactly one ownership rule.
2. Every exact-file ownership rule exists in the tracked inventory.
3. Every directory ownership rule contains at least one tracked path.
4. Regression self-tests cover stale exact paths and empty directory roots.

The stale `ARCHITECTURE.md` entry is removed from the registry in the same change.

## Consequences

- Registry drift fails the existing migration-governance validation instead of silently accumulating.
- This change does not move files, alter runtime behavior, modify D1, or deploy production.
- Future intentional empty ownership domains must not be registered until they contain tracked files, or the policy must be explicitly revised through a separate ADR.
