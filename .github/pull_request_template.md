## Feature contract
- [ ] I created or updated `docs/architecture/feature-contracts/<feature-id>.json` (or explained why this is documentation-only).
- [ ] The domain owner and technical integrator are identified in the canonical ownership map.
- [ ] I listed all shared files and cross-feature dependencies.

## Collision and compatibility review
- [ ] No duplicate route, API method, table/entity, ledger, event, global shell, or theme owner is introduced.
- [ ] Migration numbers were checked against the current canonical mainline; applied migrations are untouched.
- [ ] Route, API method, authorization/ownership, SEO, and migration registries were updated where applicable.
- [ ] SSR/client boot and source/served asset parity were checked where applicable.

## Quality and safety
- [ ] Regression tests are included and registered in the build.
- [ ] User-owned data is scoped to the authenticated owner.
- [ ] Rights, privacy, accessibility, localization, mobile, and failure states were reviewed where applicable.
- [ ] Rollout, monitoring, rollback or forward-repair plan is documented.
- [ ] I did not deploy or execute production D1 migrations as part of this PR.
