# ADR-0029: Reject stale and empty ownership rules

- **Status:** Accepted for implementation in PR #350
- **Date:** 2026-11-20
- **Decision owners:** Repository architecture and engineering governance

## Context

The shared-surface ownership registry currently covers every tracked file exactly once, but the registry also contains one exact-file rule for `ARCHITECTURE.md`, which is absent from the tracked repository. The existing validator checks that tracked files have exactly one owner and rejects overlapping roots, but it does not reject stale exact-file rules or directory rules that contain no tracked files.

A stale ownership rule weakens the registry as an authoritative source: future maintainers cannot tell whether a missing file was intentionally removed or whether the registry was forgotten.

## Decision

Keep `docs/architecture/SHARED-SURFACE-OWNERSHIP.json` as the single canonical ownership registry. Do not create a second ownership registry.

Strengthen `scripts/test-governance-ownership.mjs` so that, when the tracked repository inventory is supplied, it fails closed if:
1. An exact-file ownership rule does not match a tracked file.
2. A directory ownership rule contains no tracked files.
3. Any tracked file has zero or multiple owners.

Retain existing validation for overlapping ownership roots, malformed paths, owner identity, and same-change ADR/feature-contract requirements.

Remove the stale `ARCHITECTURE.md` rule rather than recreating a placeholder file. Preserve all historical ZIP and TXT artifacts; this decision does not authorize file deletion or movement.

## Evidence

The audit of main at `25aa2667a6a714a72578a35baac2a113f256f738` used the complete recursive Git tree (`truncated=false`) and found:
- 418 tracked file blobs
- 176 ownership path rules across 12 owner groups
- 0 unowned tracked files
- 0 multiply-owned tracked files
- 1 stale exact-file rule: `ARCHITECTURE.md`
- 0 empty directory ownership rules

## Consequences

- Registry drift becomes a CI failure instead of a documentation-only warning.
- Removing or renaming a file with an exact ownership entry requires updating the registry in the same change.
- Directory owners must remain meaningful and contain at least one tracked file.
- The root inventory remains an evidence snapshot, not an alternative source of ownership truth.
- Fine-grained domain/module boundaries and route-registry integration remain separate work.

## Validation

The migration-governance workflow runs the ownership validator and its self-tests. PR #350 adds regression cases for stale exact-file rules and empty directory rules.