# Imperial Novel: Two-Account Worker+D1 Isolation Verification 01N-32

**Phase:** 01N P0 privacy and runtime verification
**Status:** Passed in GitHub Actions on isolated integration branch
**Validated head:** `f0eaaed4fde3f962e8ddb8b865997bca57ce9e95`
**Production:** Not deployed

## Test-harness corrections

- The local runtime test now extracts the session cookie from the first Set-Cookie pair rather than relying on a malformed escaped-whitespace regular expression.
- The test explicitly applies the complete checked-in D1 migration chain to a disposable Wrangler-local database before starting the Worker.
- Deterministic test-only novel, chapter and notification fixtures are inserted into that local database. They are not written to production D1.

## Two-account test

- Registers and authenticates two separate accounts through the real Worker HTTP routes.
- Confirms the two sessions resolve to different account IDs and identities.
- Account A writes a library entry while maliciously supplying Account B's user ID. A sees the entry; B does not.
- Account A writes reading history while supplying Account B's user ID. A sees the history; B does not.
- Account A writes a bookmark while supplying Account B's user ID. A sees the bookmark; B does not.
- Account A writes 73% reading progress while supplying Account B's user ID. A reads 73%; B reads the default 0%. Hostile user_id query parameters do not change either identity.
- Seeds a private notification for each account and verifies each session can see only its own notification.
- Confirms anonymous requests to profile, library, history and bookmarks are rejected.

## Verification evidence

- [Cloudflare Source Validation run 41320162576](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41320162576) passed.
- [Graphify architecture map run 41320162572](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41320162572) passed.
- The Worker runtime step reports successful two-account isolation for library, history, bookmarks, reading positions and notifications.
- All 18 SQL migrations also passed the workflow's fresh SQLite migration test.

## Scope and remaining gaps

This proves the tested routes and fixtures under the Wrangler local Worker+D1 environment. It does not prove every private API is isolated, production Cloudflare behavior, full author/admin IDOR resistance, penetration-test readiness or protection against all data theft.

Remaining tests include cross-account OmniPortal import history and ticket-ledger isolation, author A versus author B project/novel/chapter runtime access, owner/admin/moderator permission boundaries, seeded private sentinel response checks across all public/private DTOs, and production backup/restore and deployment preflight.

## Release disposition

- PR #123 remains draft and unmerged.
- No changes merged to main.
- No production D1 migration or Cloudflare Worker deployment.
## Author A versus Author B runtime isolation extension

At integration head `91d6bfbe7ca172a64c4f5e47c7581a4b7bb34a0c`, the Wrangler local Worker test also seeds two separate author accounts, each with a distinct draft novel and chapter. It verifies:

- Each author lists their own novel but cannot see the other author's novel in `/api/author/novels`.
- Author A receives HTTP 403 when attempting to edit Author B's novel.
- Author A receives HTTP 403 when attempting to list Author B's chapters.
- Author A receives HTTP 403 when attempting to edit Author B's chapter.

Verification: [Cloudflare Source Validation run 41320963686](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41320963686) passed, including the real Wrangler local Worker+D1 test and all 18 fresh SQLite migrations. [Graphify run 41320963623](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41320963623) passed.

These tests establish ownership isolation for the tested author novel/chapter routes. They do not establish every author route or AI Author Studio project isolation.
## AI Author Studio project isolation extension

At integration head `9fc757292ae2d63b6f904deaeb88858ee8f9133c`, the local Worker+D1 test initializes the AI Author Studio schema, seeds one project for each author, and verifies:

- Each author lists only their own AI project.
- Author A receives HTTP 403 when attempting to read Author B's AI project detail.
- Author A receives HTTP 403 when attempting to modify Author B's AI project.

Verification: [Cloudflare Source Validation run 41321216441](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41321216441) passed, including the real local Worker+D1 test and all 18 fresh SQLite migrations. [Graphify run 41321216436](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41321216436) passed.

AI Author Studio generation/provider operations and all related chapter-job endpoints still require separate authorization and runtime coverage.

## AI Author Studio project isolation extension

At integration head `9fc757292ae2d63b6f904deaeb88858ee8f9133c`, the local Worker+D1 test initializes the AI Author Studio schema, seeds one project for each author, and verifies:

- Each author lists only their own AI project.
- Author A receives HTTP 403 when attempting to read Author B's AI project detail.
- Author A receives HTTP 403 when attempting to modify Author B's AI project.

Verification: [Cloudflare Source Validation run 41321216441](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41321216441) passed, including the real local Worker+D1 test and all 18 fresh SQLite migrations. [Graphify run 41321216436](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41321216436) passed.

AI Author Studio generation/provider operations and all related chapter-job endpoints still require separate authorization and runtime coverage.