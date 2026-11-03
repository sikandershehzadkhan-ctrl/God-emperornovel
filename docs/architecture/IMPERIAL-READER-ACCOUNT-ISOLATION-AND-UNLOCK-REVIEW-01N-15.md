# Imperial Novel Phase 01N.15: Reader Account Isolation and Unlock Accounting Review

**Scope:** reader-owned history, reading positions, library, bookmarks, and single/batch chapter unlock paths.  
**Branch:** `architecture/phase-01n-master-route-registry`  
**Production impact:** none. No deployment, live D1 query, schema mutation, or secret change was performed.

## Confirmed source behavior

- History GET filters by `history.user_id = current user`.
- Reading-position GET filters by the authenticated user, novel, and chapter composite key. POST additionally checks that the referenced chapter and novel are published before saving.
- Library GET filters by `user_library.user_id = current user`; embedded history and bookmark lookups correlate to that same account.
- Bookmarks GET filters by `bookmarks.user_id = current user`.
- Single chapter unlock checks existing unlocks for the current account, conditionally debits only that account's Crown balance, then gates the unlock and ledger inserts on the preceding successful write.
- Batch unlock selects chapters not already unlocked by the current account, conditionally debits that account, gates each unlock row and the ledger/batch receipt on preceding successful writes, and checks all returned D1 change counts before reporting success.
- Existing dedicated source-policy checks already cover integer/non-negative price validation, insufficient balance, duplicate debit guards, and the dependent write sequence for both unlock routes.

## New regression protection

Added `scripts/test-reader-account-isolation-policy.mjs` to assert account scoping for the four reader-owned GET routes and the account-specific unlock checks/debits. Integrated it into the `npm run build` validation chain.

These are source-policy tests. They detect accidental removal of the expected SQL predicates and bindings, but they are **not** a substitute for exercising two real accounts against a disposable D1 database or testing concurrent purchase requests.

## Remaining verification

1. Run the full build/test chain in GitHub Actions or a local Node 22 environment.
2. Add disposable-D1 integration tests with two users to prove no cross-account reads or writes.
3. Exercise concurrent single and batch unlock requests, including insufficient balance, zero-cost chapters, and duplicate requests.
4. Verify rollback behavior when a dependent unlock, ledger, or batch-receipt statement fails.
5. Reconcile fresh-install migrations with runtime-created feature tables, then verify upgrade behavior against a copy of production schema.

## Important boundary

No conclusion here certifies live production security. This is a source review plus newly added static regression coverage. The production Worker and D1 database remain unchanged.
