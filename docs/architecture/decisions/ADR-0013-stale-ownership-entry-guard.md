# ADR-0013: Reject stale root ownership entries

**Status:** Proposed  
**Date:** 2026-11-18  
**Decision owners:** Platform architecture and repository governance

## Context

The current-main ownership map covered every tracked file exactly once, but the validator only proved that tracked files had owners. It did not reject exact file entries in the registry that no longer existed. A source audit found one such stale entry: `ARCHITECTURE.md` was assigned to the architecture-contracts owner but is not present in the tracked repository tree.

A registry should be a bidirectional inventory: every tracked file must have one owner, and every registered exact file or directory root must resolve to tracked content.

## Decision

1. Remove the stale `ARCHITECTURE.md` ownership entry.
2. Extend the ownership validator to reject exact registered file paths absent from the tracked file inventory.
3. Reject directory ownership roots that contain no tracked files.
4. Run these checks whenever CI supplies the complete tracked-path inventory.
5. Keep self-tests focused by passing explicit tracked-path fixtures; changed-path-only unit tests may continue to omit the full inventory.

## Consequences

The root ownership map can no longer accumulate obsolete exact entries silently. Directory ownership roots must remain meaningful and contain tracked repository content. This complements, rather than replaces, the existing exact-one-owner and non-overlapping-root checks.

## Verification

The ownership self-test includes a stale exact-path fixture. The pull-request migration-governance workflow runs the full validator against all tracked files and will reject stale entries, missing owners, duplicate owners, overlapping roots, and missing ADR/feature-contract coverage.
