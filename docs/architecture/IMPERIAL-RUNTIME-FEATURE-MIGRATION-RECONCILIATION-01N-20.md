# Imperial Novel: Runtime Feature Migration Reconciliation (01N.20)

## Scope

This phase reconciles the ordered D1 migration chain with the lazy Worker runtime schema initializer. It does not deploy, access production D1, or modify secrets.

## Findings

- The active branch migration directory skipped sequence number 0012. The existing 0018 file is a placeholder, and 0019 owns the comment-report table and uniqueness constraint.
- Migration 0008 already creates `request_votes`; the runtime feature initializer also defensively creates it with `IF NOT EXISTS`.
- The runtime feature initializer creates `auth_rate_limits`, `comment_likes`, and `novel_reactions`, and adds `comments.parent_id` and `comments.edited_at`.
- `ensureEngagementSchema` in `src/index.js` adds the comment-like lookup index.
- PR #118 is open and proposes a different 0012: it adds FK/trigger cascades and archives then removes orphan/duplicate comment reports. That approach conflicts with this branch's explicit report-evidence retention policy and with 0019's ownership of report uniqueness. It was not copied or merged.

## Reconciliation decision

Added `migrations/0012_runtime_feature_schema.sql` as the fresh-install counterpart for the runtime feature tables and comment columns:

- Auth rate-limit storage and index.
- Comment likes and lookup index.
- Novel reactions with their existing user/novel foreign-key cascades.
- Defensive `request_votes` declaration, matching the existing 0008/runtime convergence.
- Comment parent/edit metadata columns.

Comment reports are deliberately excluded from 0012. Migration 0019 remains their single schema/uniqueness owner. Report rows are not deleted, archived, or cascaded by this migration. Migration 0020 owns report lifecycle indexes.

Added `scripts/test-runtime-feature-migration-parity.mjs` to the package build chain. It checks the ordered migration ownership boundaries and required table/index/column declarations.

## Validation status

- GitHub file creation/update operations succeeded.
- The new Node regression test has **not yet been executed** in a local Node environment.
- Full ordered migration replay, fresh-install SQLite validation, upgrade-from-legacy validation, and D1 `foreign_key_check` remain release gates.
- No production deployment or live D1 modification was performed.

## Follow-up

PR #118 must be reconciled before either branch is merged into the same target. Do not merge both 0012 implementations blindly. The report-evidence retention policy in this branch must be preserved unless an explicit product/legal decision changes it.
