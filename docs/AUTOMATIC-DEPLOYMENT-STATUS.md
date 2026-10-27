# Imperial Novel automatic deployment: current state

## Safety rule
Do not deploy the legacy ZIP to the production Worker until its contents and database bindings have been verified. The production Worker is `god-emperornovel`; production D1 is `god-emperornovel-db`.

## What is in this branch
- `.github/workflows/validate-cloudflare-source.yml`: validation-only workflow. It requires a root-level application source tree and then runs the Cloudflare readiness check and build. It never deploys.
- `.github/workflows/audit-legacy-zip.yml`: non-deploying inspection of the old `Imperial-Novel-16.4.0-Chapter-Creation-Repair.zip`, reporting package manifests and Wrangler configuration.
- Existing `.github/workflows/deploy.yml` on `main` still unpacks the old 16.4.0 ZIP and deploys whatever Wrangler project it finds. This is not a safe source-of-truth workflow and should be replaced only after the intended source has been confirmed.

## Verification result so far
The source-validation workflow ran and failed at its intentional guard because there is no root-level `package.json`. Dependency installation and build were skipped. This is a successful safety catch, not a successful application build.

## Required next steps
1. Retrieve the audit artifact from the GitHub Actions run for `Imperial Novel Legacy ZIP Audit` and inspect its contents.
2. Identify the intended, current Imperial Novel release source. Do not assume a recent local ZIP exists in this repository.
3. Ensure the source tree has `package.json`, a lockfile, Cloudflare build scripts, Wrangler config, and D1 migrations consistent with SQLite/D1.
4. Configure an isolated staging Worker (suggested name: `imperial-novel-staging`) and a separate staging D1 database. Do not bind production D1 to staging.
5. Add GitHub Actions secrets for a narrowly scoped Cloudflare API token and account ID. Never put credentials in repository files.
6. Build and deploy to staging, run smoke tests, and confirm the staging site is healthy.
7. Only after manual review, configure production deployment with explicit environment separation and post-deploy health checks.

## Current status
No staging or production deployment is performed by the new workflows. Automatic production deployment is not yet enabled.
