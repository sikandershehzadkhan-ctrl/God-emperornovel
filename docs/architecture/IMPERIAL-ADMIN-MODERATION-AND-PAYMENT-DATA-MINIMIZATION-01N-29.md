# Imperial Novel: Administrative and Moderation DTO Minimization 01N-29

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on isolated integration branch
**Validated head:** `afadb955aa74c474927e1c6458ce211cec2d0f29`
**Production:** Not deployed

## Changes

- Community moderation report listing now selects only report identity, reporter, target comment, reason/details/status/time and display context.
- Publishing review queue now uses an explicit novel field list rather than `n.*`; review-relevant rights and publication fields remain available to authorized reviewers.
- Donation administration list selects explicit transaction and account-display fields rather than `d.*`.
- General report listing and novel request listing use explicit field allowlists.
- Connector authorization review listing selects explicit request/review fields.
- Connector administration no longer returns the configured secret binding name; it returns a boolean `has_secret` indicator instead.

## Verification

- Extended `scripts/test-public-novel-dto.mjs` to assert all seven administrative DTO boundaries.
- [Cloudflare Source Validation run 41317018140](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41317018140) passed.
- [Graphify architecture map run 41317018177](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41317018177) passed.

These checks establish source allowlist assertions and the existing local Worker+D1 smoke suite. They do not establish role-separated live authorization, payment-provider security, or seeded private-data sentinel behavior.

## Remaining work

- Verify role-specific access for owner, admin, moderator, author and ordinary user using separate authenticated runtime sessions.
- Review all admin mutation endpoints for least-privilege permissions, approval separation and audit coverage.
- Add seeded D1 sentinel tests for rights evidence, report details, payment references and connector authorization data.
- Confirm the frontend consumes the revised DTOs without relying on removed fields.

## Release disposition

- PR #123 remains draft and unmerged.
- No merge to main, production D1 migration or Worker deployment.