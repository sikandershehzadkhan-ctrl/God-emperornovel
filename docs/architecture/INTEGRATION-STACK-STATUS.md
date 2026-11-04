# Canonical integration stack

Updated after the validated Author Studio/media integration.

## Current development stack

1. `main` remains the production-source baseline; no production release has been made.
2. `feature/profile-identity-17-23` is the profile identity prerequisite.
3. `feature/account-username-security-17-24` now contains the validated account, Author Studio, community/runtime, media/comics, payment-safeguard and ratings integration.
4. `integration/author-canonical-v3-17-25` was merged into this branch through PR #183 after Cloudflare Source Validation and Graphify both passed.

## Canonical migration ownership

The current integration sequence is globally unique from 0001 through 0035:

- 0012–0015: profile/account identity, username history and preferences.
- 0016–0017: chapter revisions and scheduled publication.
- 0018–0027: media, rights, comics, donation review, admin ticket adjustments and request refunds.
- 0028–0031: community/runtime integrity, chapter timestamps, daily analytics and account closure.
- 0032–0033: Author Studio writing goals and private notes.
- 0034–0035: ratings baseline and 1–5 to 1–10 conversion.

See `CANONICAL-MIGRATION-COLLISION-REGISTER.md` for branch-local mappings and schema collision decisions.

## Preserved data contracts

- Reader progress uses the canonical optimistic-concurrency `reading_positions.percent/revision` API; competing branch-local per-chapter/history progress schemas are not layered on top.
- Ratings are whole-number 1–10. Legacy 1–5 values are converted to even values, timestamps retained, and novel averages recomputed.
- Private Author Studio goals/notes and account/session data remain owner-scoped.
- Payment webhooks and external media storage remain disabled until their separate provider/binding gates are satisfied.

## Author Studio application layer

Writing goals, private chapter-linked notes and deterministic editorial readiness APIs/UI are now integrated on this account branch and registered in the build regression suite. The existing comic page manager and private media library remain intact.

## Validation and release boundary

The exact integration tree at `ef6cf9c1f54073a809caad50ab89ba008cf000f3` passed:
- Cloudflare Source Validation run 2352.
- Complete application build and registered regression suite.
- Wrangler Worker dry-run.
- Production safety invariants.
- Fresh SQLite replay of the complete migration chain.
- Graphify architecture map run 2259.

PR #183 merged this validated tree into the account-security development branch. The subsequent merge commit `9536c18eeb0dc61e4cb34c4a49227ae5e2138800` contains the same integrated tree.

No production D1 migration or Worker deployment has been performed. Production migration still requires a verified backup, exact remote migration-ledger inspection, compatibility rehearsal and separately approved release.
