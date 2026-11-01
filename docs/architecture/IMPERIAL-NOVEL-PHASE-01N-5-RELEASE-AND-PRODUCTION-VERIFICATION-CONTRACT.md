# Imperial Novel | Phase 01N.5: Release & Production Verification Contract

**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Release architecture specification; no release executed.

## 1. Objective

A release is complete only when the exact source commit, build artifact, schema state, Worker configuration, static assets and production smoke tests are tied together by evidence. “Workflow succeeded” alone is not enough if the live site still serves an older bundle, the D1 schema is incompatible or critical routes fail.

Production deployment remains manually triggered with explicit confirmation. No push, pull-request merge or branch update should publish to the live Worker automatically.

## 2. Current branch evidence

Observed:
- `.github/workflows/deploy.yml` uses manual `workflow_dispatch`.
- It requires `confirm_production_deploy=true`.
- It validates source/config, installs dependencies, runs `npm run build`, and applies additive D1 migrations before Worker deployment.
- It checks Cloudflare credential presence and `wrangler whoami`.
- It includes production schema compatibility checks and post-deploy route/API/D1 verification.
- `wrangler.toml` binds the Worker to `god-emperornovel-db`, assets to `./public`, and uses `src/index.js`.
- Package version observed is 17.23.0.
- The production workflow source asserts migrations 0009–0011 and checks Discover, Author Studio and admin routes.

Known blocker:
- The clean SQLite migration preflight appears inconsistent because migration 0010 depends on `novels.publication_status`, while migration 0001 does not define it and the SQL-only preflight does not execute the runtime publishing schema helper. Resolve this before trusting the clean-install gate.

No credentials, production migration history, deployment SHA or live D1 schema were inspected.

## 3. Release identity contract

Every release record must bind:
- repository and branch;
- immutable Git commit SHA;
- package/app version;
- migration set and checksums;
- Wrangler configuration checksum;
- build workflow run ID;
- build artifact identity/checksum where available;
- Worker deployment version/ID;
- deployment timestamp;
- D1 migration history before and after;
- post-deploy verification result;
- operator confirmation and release notes.

Never report “production updated” based solely on a GitHub commit or ZIP creation. A branch commit is not a deployment.

## 4. Pre-release gates

### Source and artifact
1. Confirm release branch is based on the intended source commit.
2. Review changed files and generated assets.
3. Run dependency lockfile consistency and `npm ci`.
4. Run all build tests and syntax checks.
5. Verify app version and cache-busted asset filenames agree.
6. Verify public HTML references every required versioned CSS/JS/icon/manifest asset.
7. Check bundle size and mobile performance budget.
8. Run dependency and secret scanning.
9. Verify no test/demo placeholder content is being promoted unintentionally.

### Schema
1. Compare current production D1 migration history with target migration set.
2. Verify schema marker and actual required tables/columns/indexes.
3. Run fresh-database migration preflight.
4. Run upgrade-path test from each supported production baseline.
5. Verify every migration is additive or has an approved data-preserving rebuild plan.
6. Confirm backup/restore or forward-recovery plan.
7. Apply migrations before deploying code that depends on them.
8. Verify exact post-migration structures.
9. Block deploy on unknown marker, missing column, checksum mismatch or partial migration.

### Runtime configuration
1. Confirm Worker name, entrypoint, compatibility date and asset directory.
2. Confirm D1 binding points to the intended database.
3. Confirm production vars are correct and no preview URL is embedded.
4. Confirm required secrets exist without printing their values.
5. Keep optional AI, payment and connector features disabled unless configured and verified.
6. Confirm cron triggers and their idempotency/overlap behavior.
7. Confirm connector allowlist and rights approval state.

## 5. Deployment sequence

1. Manual operator selects the intended immutable commit.
2. Workflow validates explicit production confirmation.
3. Build and test without changing production.
4. Validate migration sequence on clean SQLite and supported upgrade fixtures.
5. Read production schema/migration metadata.
6. Apply only reviewed additive migrations.
7. Verify D1 objects and migration history.
8. Deploy Worker and static assets.
9. Verify deployed Worker version and release identity.
10. Run post-deploy smoke tests.
11. Monitor health, error rate, latency and key queues.
12. Record outcome and close release only after verification.

If a migration fails, do not deploy code requiring it. If Worker deployment fails after a migration, follow the approved forward-compatibility/rollback plan; do not blindly reverse financial/content schema.

## 6. Post-deploy smoke test groups

### Availability and routing
- `/`, `/catalog`, `/discover`, `/genres`, `/tags`, `/search`;
- `/novel/:id` for a known published rights-eligible record;
- `/read/:novelId/:chapterNumber` for a permitted chapter;
- `/become-an-author`, `/author`, `/trend-factory`, `/omniportal`;
- `/account`, `/library`, `/notifications`, `/admin`;
- legal routes, robots and sitemap.

Validate direct URL load, not only in-app navigation. Check response status, content type, canonical URL, cache headers and expected asset version.

### API and data
- `/api/health` confirms D1 connectivity and expected release version.
- Public catalog API returns only published and rights-eligible records.
- Anonymous requests to protected endpoints receive expected 401/403.
- Owner-scoped APIs do not disclose another user's data.
- Rating rejects values outside integer 1–10.
- Notification and reading-position APIs return safe, correctly scoped data.
- Payment webhook remains disabled until provider-specific verification is implemented.
- No pending payment is presented as approved or credited.

### Assets and visual integrity
- All referenced versioned CSS/JS assets return 200.
- Crest/icon, manifest and app icon resolve to the intended brand assets.
- No stale hero, previous logo or mismatched cache version.
- No blank/black screen on first load, refresh or direct deep link.
- No uncaught client errors on core pages.
- Mobile navigation and reader controls fit small screens.

### Operational checks
- D1 schema marker and migration history match release expectations.
- Scheduled automation last-run/error state is visible.
- Provider health displays last check and rights status separately.
- No secret appears in HTML, API responses, logs or browser assets.
- Error rate and latency remain within agreed thresholds.
- Rollback/forward recovery remains available.

## 7. Cache and stale-release diagnosis

When the site appears unchanged after a reported deploy:
1. Verify the actual Worker deployment version/ID and commit mapping.
2. Fetch HTML and inspect versioned asset references.
3. Fetch the exact referenced CSS/JS assets and compare their hashes/build IDs.
4. Confirm `APP_VERSION` and `APP_ICON_PATH` on the deployed Worker.
5. Confirm assets directory and Worker-first routing match the intended build.
6. Inspect browser/service-worker caches only after the served release is identified.
7. Check whether another workflow or deployment overwrote the Worker afterward.

Do not assume browser cache is the cause until the live Worker version and asset references are verified.

## 8. Rollback and incident handling

- Keep the previous known-good Worker version and artifact identity.
- Prefer a Worker rollback only when the previous Worker remains compatible with the current additive D1 schema.
- Do not roll back database schema by dropping columns/tables after data has been written.
- Use forward fixes for irreversible data changes unless a tested restoration procedure exists.
- Disable affected feature flags/provider connections if a safe rollback is unavailable.
- Preserve audit, deployment and incident records.
- Communicate degraded features honestly; do not hide failed payment, import or publishing states.

## 9. Release dashboard fields

Display:
- current deployed version and commit;
- deployment timestamp and workflow run;
- D1 schema/migration version;
- Worker health and database connectivity;
- latest smoke-test result;
- static asset version consistency;
- active incidents;
- pending migrations;
- last scheduled agent success/failure;
- provider health freshness;
- payment feature enabled/disabled state;
- rollback target and compatibility note.

Unknown values display “not verified”, not a guessed value.

## 10. Acceptance criteria

1. Production deploy cannot run from push or pull request.
2. Manual confirmation must be explicitly true.
3. Build and migration checks complete before any production mutation.
4. Fresh and upgrade migration paths both pass.
5. Schema compatibility is checked against actual production D1.
6. D1 migration history is recorded and verified.
7. Worker and assets deploy from the same immutable commit.
8. Post-deploy health reports the expected app version.
9. All critical direct routes and versioned assets pass smoke checks.
10. Public catalog filters unpublished/unlicensed content.
11. Protected APIs reject anonymous and cross-owner access.
12. Payment webhook remains blocked until signature/replay/amount/currency verification exists.
13. The release record includes exact commit, workflow, Worker version and verification results.
14. Failed post-deploy checks prevent release closure and trigger the recovery plan.
15. User-facing reports distinguish branch commits, CI success and production deployment.

## 11. Completion boundary

This release contract specifies target controls. The workflow and tests were inspected but not executed. No secrets, Cloudflare settings, production D1, Worker, DNS, branch protection or deployment were changed.
