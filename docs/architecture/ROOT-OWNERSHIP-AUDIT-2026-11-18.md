# Imperial Novel Root Ownership Audit

**Audit date:** 2026-11-18  
**Audited base:** `main` at `f7d5879b500355d5834f3deb4be00f21a5baa4a1`  
**Audit implementation branch:** `architecture/phase-01-foundation-route-registry`  
**Scope:** Tracked-file ownership coverage and root-level repository hygiene.

## Verified inventory

| Measure | Current main before this PR | PR branch after foundation changes |
|---|---:|---:|
| Tracked file blobs | 418 | 423 |
| Root-level tracked files | 149 | 149 |
| Ownership path rules | 176 | 175 |
| Owner groups | 12 | 12 |
| Tracked files with no owner | 0 | 0 |
| Tracked files with multiple owners | 0 | 0 |
| Stale ownership entries | 1 | 0 |

The registry is `docs/architecture/SHARED-SURFACE-OWNERSHIP.json`. Its directory rules are initial ownership boundaries, not claims that every file inside a directory is already a separately governed module.

## Root-level file composition

The 149 root-level tracked files break down as:

- 76 ZIP archives
- 67 TXT deployment notes and trigger artifacts
- 1 Markdown file
- 5 other files

The root-artifact owner explicitly enumerates historical archives and deployment artifacts. The three separate build/runtime root files are `package.json`, `package-lock.json`, and `wrangler.toml`.

## Finding and correction

The original ownership map assigned `ARCHITECTURE.md` to the architecture-contracts owner even though that exact file is absent from the tracked tree. This did not leave any tracked file unowned, but it meant the registry could contain stale entries without detection.

This PR removes the stale entry and extends `scripts/test-governance-ownership.mjs` to enforce both directions:

1. Every tracked file must match exactly one ownership rule.
2. Every exact file rule must exist in the tracked inventory, and every directory rule must contain at least one tracked file.

The migration-governance workflow already runs the ownership validator on pull requests, so this stronger check becomes an existing CI gate rather than a separate, unconnected audit.

## Decisions and non-actions

- Preserve the historical ZIP/TXT artifacts for now. No evidence has been established that they are safe to delete or move.
- Do not reorganize root files while route, sitemap, and release workflows are being reconciled.
- Keep root-level artifacts under an explicit archive/reference ownership policy until a separate retention and recovery review approves any move.
- Treat zero unowned files as necessary but not sufficient: future domain splitting still requires narrower ownership boundaries, clear change authority, and dependency rules.

## Acceptance status

- Complete tracked-file ownership coverage: verified on current main and PR branch.
- Duplicate ownership: none observed.
- Stale registry entry: corrected; validator now rejects future stale entries.
- Root artifact retention/movement: intentionally deferred pending a separate impact review.
- Fine-grained domain/module ownership and dependency direction: still requires architecture refinement.
