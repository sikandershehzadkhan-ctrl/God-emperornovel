## Feature contract
- [ ] This PR changes one coherent concern; unrelated work is split or justified.
- [ ] Domain owner and technical integrator are identified.
- [ ] Canonical source paths and all shared files touched are listed.
- [ ] Dependencies and required prerequisite PRs are listed.

## Collision and compatibility review
- [ ] Shared Worker, browser, build, workflow and registry surfaces were checked against other open PRs.
- [ ] No duplicate route, API method, table, ledger, event, or ownership contract is introduced.
- [ ] Existing migrations are unchanged; new migration numbers are unique and greater than the base maximum.
- [ ] Route, API method, authorization and migration registries are updated where applicable.
- [ ] Source and generated/served asset parity is verified where applicable.

## Quality and safety
- [ ] Regression tests are included and run in CI, including negative cases for security-sensitive behavior.
- [ ] User-owned data is scoped to the authenticated owner on the server.
- [ ] Rights, privacy, accessibility, localization, mobile and failure states were reviewed where applicable.
- [ ] Rollout, monitoring, rollback or forward-repair plan is documented.
- [ ] No production deployment or production D1 migration was run as part of this PR.
