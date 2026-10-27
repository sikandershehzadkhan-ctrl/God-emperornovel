# Imperial Novel automatic deployment: current state

## Safety rule
Do not deploy an unverified legacy ZIP to the production Worker. Production identifiers are Worker `god-emperornovel` and D1 database `god-emperornovel-db`.

## Confirmed repository findings
- The repository contains multiple historical release ZIPs, including `Imperial-Novel-16.60.0-IMPERIAL-ASSETS-AND-CATALOG-UPDATE-1.zip` and `Imperial-Novel-16.64.0-THREE-LINE-MENU-DESIGN-UPDATE.zip`.
- The repository root does **not** contain the actual application `package.json` or `package-lock.json`. Its root `index.html` is an older placeholder page, and `wrangler.toml` points static assets at the repository root. That is not sufficient proof of the intended current application source.
- No GitHub Releases were found in the repository at the time of this audit.
- Several old workflows extracted historical ZIPs and ran Wrangler without a source-validation or build gate. Those seven obsolete workflows have been removed from `main`: the 16.5.0, 16.16.0, 16.16.1, 16.16.2, 16.16.3, 16.17.0 and 16.18.0 workflows.
- The remaining production workflow `.github/workflows/deploy.yml` fails closed unless a root application manifest, lockfile and Wrangler configuration exist, then runs the Cloudflare readiness check and build before it can deploy.
- A main-branch push triggered some legacy workflows before their removal took effect. The observed 16.17.0 and 16.18.0 deploy steps failed; the 16.16.1 build failed at dependency installation. No successful legacy Cloudflare deploy was observed in those runs. Continue checking run history after workflow cleanup.

## Verification result
The source-validation workflow intentionally stopped because the root `package.json` is missing. This is a safety guard, not a successful application build.

## Next engineering steps (handled by the maintainer)
1. Recover and inspect the intended current source tree from the latest release archive.
2. Confirm the archive's framework, entrypoint, build scripts, Wrangler config and assets layout.
3. Verify all migrations are D1/SQLite-compatible and do not silently target production.
4. Build and smoke-test from the real source before any production deployment. Prefer a separate staging Worker and staging D1 database if credentials and account access permit.
5. Verify the public site after deployment. Never claim visual changes are live based solely on a successful ZIP extraction.

## Current status
The legacy automatic deployment paths have been removed and the remaining deploy path has a source/build gate. The correct application source still needs to be restored to the repository root. No verified visual website update has been deployed by this work, and no production D1 migration has been run.
