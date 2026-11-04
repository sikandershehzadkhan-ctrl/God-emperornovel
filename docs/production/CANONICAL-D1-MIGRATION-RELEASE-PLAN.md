# Canonical production D1 migration release plan

STATUS: BLOCKED

## Why production release is blocked

The development integration now has one canonical migration chain, 0001–0035. The production deployment workflow previously referenced branch-local files named `0012_chapter_revisions.sql` and `0013_scheduled_chapter_publications.sql`. Those names are no longer valid in the canonical chain: profile/account migrations own 0012–0015, and chapter revisions/scheduling are 0016–0017.

The production D1 database's exact applied migration history has not been inspected and reconciled in this work session. A source-tree replay against fresh SQLite is not evidence of the remote D1 state.

The workflow is therefore hard-disabled. Do not remove that block merely to deploy the new Worker.

## Canonical migration chain

- 0001–0011: existing platform foundation and author application base.
- 0012: user profiles.
- 0013: username change cooldown/history.
- 0014: account preferences.
- 0015: historical username insert guard.
- 0016: chapter revisions.
- 0017: scheduled chapter publications.
- 0018–0027: media, rights, comics, quotas, donation review, ticket adjustments and novel-request refunds.
- 0028: community/runtime integrity reconciliation.
- 0029: chapter update timestamps.
- 0030: daily view analytics.
- 0031: account closure requests.
- 0032: Author Studio writing goals.
- 0033: private creator notes.
- 0034: fresh-install legacy ratings baseline.
- 0035: one-time 1–5 to 1–10 rating conversion and aggregate recomputation.

## Required work before a production release

1. Obtain a recoverable production D1 backup and verify that it can be restored.
2. Inspect the remote D1 schema marker, tables, columns, indexes, triggers, foreign keys and any existing migration ledger using read-only queries.
3. Compare the actual remote schema against each canonical migration. Determine which changes were previously applied manually, through runtime bootstrap, or by earlier deployment workflows.
4. Build a signed-off applied-migration ledger with the exact canonical filename and SHA-256 checksum for every migration already represented in production. Never infer that a migration ran merely because a similarly named table exists.
5. Rehearse the remaining migration plan against a production-shaped disposable SQLite/D1 copy, including legacy profile/account data, existing chapter revisions, media/comic references, community records, tickets/donations, private author data and existing ratings.
6. Pay special attention to migration 0035. It rebuilds the ratings table and maps old scores 1–5 to 2/4/6/8/10. Verify the existing table constraint and data, preserve timestamps, recompute novel averages, and prove the operation is applied exactly once.
7. Only after review, implement a ledger-aware runner that applies only verified missing migrations, records checksums transactionally where possible, stops on any mismatch, and verifies post-migration schema.
8. Re-enable production deployment in a separate reviewed change with explicit approval. Deploy only after the D1 migration step and Worker dry-run both pass.

## Current safety state

- Production D1 migration: not performed.
- Production Worker deployment: not performed.
- Remote migration ledger: not verified.
- Existing deployment workflow: hard-disabled in `.github/workflows/deploy.yml`.
- Fresh SQLite migration replay: validated in Cloudflare Source Validation, but it does not replace the remote audit above.
