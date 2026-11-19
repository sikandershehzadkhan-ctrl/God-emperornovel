# Imperial Novel Root Ownership Audit

**Audit date:** 2026-11-20  
**Audited base:** `main` at `25aa2667a6a714a72578a35baac2a113f256f738`  
**Audit source:** GitHub recursive Git tree plus `docs/architecture/SHARED-SURFACE-OWNERSHIP.json`  
**Scope:** Every tracked file, ownership-rule coverage, and root-level repository hygiene.

## Verified inventory

| Measure | Main before this PR |
|---|---:|
| Tracked file blobs | 418 |
| Root-level tracked files | 149 |
| Ownership path rules | 176 |
| Owner groups | 12 |
| Tracked files with no owner | 0 |
| Tracked files with multiple owners | 0 |
| Stale exact-file ownership rules | 1 |
| Empty directory ownership rules | 0 |

The recursive Git tree was complete (`truncated=false`). Each tracked blob was matched against exact-file rules or directory-prefix rules. No tracked file was unowned or multiply owned.

## Root-level file composition

The root contains 149 tracked files:
- 76 historical ZIP archives
- 66 historical deployment/trigger TXT artifacts
- 2 repository documentation files
- 4 build/runtime configuration files
- 1 HTML entrypoint

The root also contains seven directories. The ZIP and TXT artifacts are retained unchanged. This audit does not approve deletion, movement, or archival.

## Finding and correction

The ownership registry assigned `ARCHITECTURE.md` to `architecture-contracts`, but that exact file is absent from the tracked tree. This was a stale ownership rule, not an unowned tracked file.

This PR removes the stale exact-file rule and strengthens `scripts/test-governance-ownership.mjs` so the build gate now rejects:
1. Any tracked file with no owner.
2. Any tracked file with multiple owners.
3. Any exact-file ownership rule pointing to a missing tracked file.
4. Any directory ownership rule that contains no tracked files.
5. Overlapping ownership roots and malformed ownership paths (existing protections retained).

Regression self-tests cover stale exact rules and empty directory rules. The existing migration-governance workflow runs this validator.

## Decisions and non-actions

- Preserve historical ZIP/TXT artifacts until a separate retention and recovery review approves changes.
- Do not reorganize root files while route, sitemap, and release workflows are being reconciled.
- Keep the existing shared-surface registry as the single ownership source; this audit is evidence, not a competing registry.
- Fine-grained module ownership and dependency direction remain separate architecture work.

## Acceptance status

- Complete tracked-file ownership coverage: **verified** on the audited main commit.
- Duplicate ownership: **none observed**.
- Stale exact ownership: **corrected in this PR**.
- Empty directory rules: **none observed; validator now rejects future empty rules**.
- Historical artifact retention/movement: **deferred** pending impact review.
- Fine-grained domain/module ownership: **still requires architecture refinement**.
