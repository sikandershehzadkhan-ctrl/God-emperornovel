# ADR-0032: Canonical root-path ownership contracts and fail-closed import direction

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0021, ADR-0030, and SHARED-SURFACE-OWNERSHIP.json

## Context

The ownership registry already assigned one owner to every tracked path and rejected stale exact paths, empty directory roots, overlapping ownership roots, and unowned changes. However, each owner entry only declared paths and an ADR requirement. It did not define the permitted contents of those paths, accountable change/integration roles, or allowed dependency direction.

The governance check also did not inspect relative imports, so a file could be moved under another domain while retaining an unauthorized cross-domain dependency.

## Decision

The registry schema is upgraded to version 2 and explicitly identifies itself as the canonical root-path ownership registry. Every owner must declare:
- Accountable role, change owner, and integration owner.
- Path class and permitted contents.
- Dependency direction and allowed static-import dependencies.
- Build/CI invocation relationships and runtime contracts.
- Shared-surface change policy and ADR requirement.

The policy is fail-closed for unregistered tracked/changed paths, duplicate ownership, stale exact paths, empty directory roots, missing owner metadata, unresolved relative imports, and unauthorized cross-domain imports.

The governance validator now scans tracked JavaScript/TypeScript module imports, resolves relative paths against the tracked-file inventory, rejects unresolved relative imports, and enforces the source owner's allowed dependency list. Same-owner imports remain allowed. Runtime contracts such as HTTP APIs, D1 bindings, asset bindings, and CI invocation are documented separately and do not grant static import permission.

The root index.html and historical root archives are explicitly classified as non-served artifacts; the validator checks that Wrangler continues to serve assets only from ./public.

## Validation

The self-test suite covers owner metadata, exact path coverage, ADR requirements, import direction, dependency cycles, unresolved relative imports, stale paths, empty roots, and duplicate/overlapping owners. The migration-governance workflow runs both self-tests and the complete tracked-repository/import inventory on pull requests.

## Evidence boundary

The import scanner covers relative static imports, dynamic imports, and CommonJS requires in tracked JS/TS files. It does not yet parse every possible CSS, HTML script, package-manager, or runtime HTTP dependency. Those are represented through separate ownership/runtime-contract metadata and may receive dedicated validators as needed. No production deployment or D1 mutation is included.
