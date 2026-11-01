# Imperial Novel: Migration 0012 History and Cross-PR Integration Correction

**Purpose:** Correct and extend the static migration audit `IMPERIAL-D1-MIGRATION-AND-RUNTIME-SCHEMA-RECONCILIATION-01N-13.md` after inspecting the referenced pull requests.
**Inspected:** 1 November 2026

## 1. Correction to the earlier finding

The earlier audit correctly observed that `migrations/0012_runtime_feature_schema.sql` was absent from the inspected architecture branch tree and that migrations 0014 and 0018 referred to it. The broader interpretation needs refinement: migration 0012 is not an unexplained or forgotten file. It is proposed in open draft PR #118, branch `fix/community-schema-foundation-001`.

PR #118 is still open, draft, and unmerged at the time of this inspection. Therefore its migration is not part of the inspected architecture branch's migration sequence and must not be treated as integrated or production-applied.

## 2. What PR #118 proposes

PR #118 title: **Harden runtime community schema and add migration parity**.

Inspected migration file: `migrations/0012_runtime_feature_schema.sql`, blob `765a5ad7790181f22b41dedaa3ddb8b82d9e7b25`.

Inspected runtime initializer: `src/runtime-feature-schema.mjs`, blob `13685b1a599e0a43037bf2e36e8306afb5d5fd65`.

The PR proposes:

- Declarative migration DDL for auth rate limits, comment likes/reports, novel reactions and request votes.
- Foreign keys for fresh installs.
- Validation and delete-cascade triggers for legacy tables that `CREATE TABLE IF NOT EXISTS` cannot retrofit.
- Archival of duplicate/orphan comment reports before active-row cleanup.
- Cleanup of orphan likes, reactions and request votes.
- A runtime feature schema marker upgrade from version 1 to 2.
- Node regression coverage and a SQLite legacy-schema integration test.

The PR description reports Cloudflare Source Validation and Graphify passing on commit `0d35bc6ad68b44d4242cdaee20c322ab1048f0cc`. This is PR-authored validation evidence, not a validation run performed by this audit.

## 3. PR #120 migration sequencing

PR #120 is also open and draft. Its migration files were re-sequenced to leave number 0012 available for PR #118. It currently uses 0013 through 0018. PR #120 discussion records a later cleanup so 0014 and 0018 no longer attempt to define community tables owned by 0012; they are intended to own only their separate indexes or remain dependency-free as described in the PR discussion.

PR #120 discussion reports Cloudflare Source Validation and Graphify passing on commit `0650a957abf75d169fe0a6cc0ce4869c7e5cc287`, with later follow-up changes also described. These reports do not establish that PR #118 and PR #120 have been validated together on one combined branch.

## 4. Remaining integration gate

Both PRs are still unmerged in the inspected state. The correct status is therefore:

- Migration 0012: authored in PR #118, not yet integrated into the architecture branch or main at the time of inspection.
- Migrations 0013–0018: authored/resequenced in PR #120, with PR discussion documenting removal of duplicate community table ownership.
- Combined migration chain: **not yet proven by the evidence inspected here**.
- Production D1: no access or changes performed by this audit.

Before either PR is considered release-ready, run the complete ordered migration set together against a clean SQLite/D1-compatible database and a representative legacy community schema. Confirm the runtime initializer's version-2 behavior matches the migration, not just that each PR passes its own branch-local CI.

## 5. Additional migration safety review required

The PR #118 migration contains data-changing cleanup. It archives comment reports that are duplicates or have missing parent references, then deletes the invalid active records. It deletes orphan likes, reactions and request votes. Before this reaches production, confirm:

1. The archive table preserves all report fields needed for moderation/legal audit and has a retention/access policy.
2. Archive writes and active-row cleanup are atomic under the actual D1 migration execution model.
3. The migration is safe to retry if execution is interrupted.
4. Existing indexes and triggers are compatible with both legacy and fresh schemas.
5. The runtime schema initializer and migration cannot advance their marker while only partially applying required integrity controls.
6. `PRAGMA foreign_keys` behavior and D1 trigger/constraint behavior are tested in the actual target environment.
7. The application handles the new unique `(user_id, comment_id)` report rule without returning generic 500 errors on repeat reports.
8. The legacy archive is not exposed to ordinary users or broad generic administrators.

## 6. Corrected disposition

The finding is not simply 'migration 0012 missing'. The accurate finding is **migration 0012 is pending integration through draft PR #118, while the inspected architecture branch has not yet received it**. The architecture branch must be refreshed/rebased against the integrated result before any further source conclusions are treated as current.

Do not merge, deploy or apply migrations based solely on the PR descriptions. Require combined CI, review of the complete diff, and a verified backup/restore path first.

**No source code changed. No PR merged. No D1 migration executed. No production deployment performed.**