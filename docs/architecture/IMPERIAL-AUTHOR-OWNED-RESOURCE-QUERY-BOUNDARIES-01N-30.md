# Imperial Novel: Author-Owned Resource Query Boundaries 01N-30

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on isolated integration branch
**Validated head:** `6070dc9f0dad232b450ea5cb5a23efa54ed9928c`
**Production:** Not deployed

## Author Studio AI project access

- AI project update, blueprint generation and chapter generation no longer load wildcard project rows.
- Those operations use an explicit internal field set that retains `owner_user_id` for the authorization decision but does not serialize it in the project detail response.
- Existing ownership checks remain in place.

## Author novel access

- Author novel submit and edit routes now load an explicit set of fields needed for owner verification, rights checks, review state and safe updates.
- The same explicit selection is used by matching admin publishing mutation code where the query pattern is shared; this change does not alter role policy.

## Author chapter access

- Chapter edit and publication routes now select explicit chapter fields plus the parent novel's owner ID; publication additionally selects rights status.
- Removed wildcard chapter row selection from these author mutation paths.

## Regression and CI

- Extended `scripts/test-public-novel-dto.mjs` to reject wildcard project, novel and chapter selectors in these author routes and assert the explicit selectors.
- An initial CI run caught a malformed line separator in the new test file. The test source was corrected and rerun.
- [Cloudflare Source Validation run 41317519356](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41317519356) passed on the exact validated head.
- [Graphify architecture map run 41317519359](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41317519359) passed on the exact validated head.

These are source-level assertions and the existing local Worker+D1 smoke suite. They do not establish two-account runtime isolation, full IDOR/BOLA coverage or production authorization correctness.

## Remaining work

- Test with two seeded authenticated users and prove cross-account project, novel, chapter, history, bookmark, library and notification reads/writes are rejected.
- Test administrator and moderator role boundaries separately from owner and author.
- Add seeded private sentinel fields and inspect actual response JSON.
- Review mutation authorization, ownership reassignment and audit coverage.

## Release disposition

- PR #123 remains draft and unmerged.
- No merge to main, production D1 migration or Cloudflare Worker deployment.