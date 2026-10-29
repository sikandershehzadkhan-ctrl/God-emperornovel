# Worker Version Drift Investigation

## Status: unresolved, evidence collected 2026-10-29

### Confirmed evidence
- Repository `wrangler.toml` on `main` declares Worker `god-emperornovel`, D1 database `god-emperornovel-db`, and `APP_VERSION = "17.13.0"`.
- `src/index.js` health route returns `version: env.APP_VERSION || "5.0.0"`; there is no literal `16.63.0` in the inspected source.
- GitHub Actions run [40825074830](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/40825074830) successfully completed Wrangler deployment. Its log reports:
  - `Uploaded god-emperornovel`
  - Worker URL `https://god-emperornovel.sikandershehzadkhan.workers.dev`
  - Current Version ID `a4fd8a21-fbfb-4c8a-9eab-ab0e02ca9d46`
  - Wrangler displayed `env.APP_VERSION ("17.13.0")`
- The same run's uncached public health check returned `{"ok":true,"service":"Imperial Novel","version":"16.63.0","database":true,...}`, and the job correctly failed.
- The deploy job ran `wrangler whoami` successfully and identified the account name as `Sikandershehzadkhan@gmail.com's Account`. The account ID is masked in GitHub logs and was not exposed in this report.
- The deployed workflow did not reach the homepage asset verification step because the health-version gate failed first.

### What this rules out
- It was not merely a GitHub source commit with no Cloudflare deployment attempt.
- It was not a failed build or missing D1 binding in the logged deployment.
- The inspected current health handler does not hard-code 16.63.0.

### Remaining hypotheses (not yet proven)
1. The public hostname is resolving to a different active deployment/Worker route than the deployment target just updated.
2. A competing deployment or traffic split is serving a prior version.
3. The Worker deployment metadata/traffic assignment in the Cloudflare account differs from what the deploy log alone implies.
4. A separate external deployment process or Cloudflare dashboard action is updating the same service.

### Safe next diagnostic
Use the manual, read-only `.github/workflows/cloudflare-worker-identity-audit.yml` workflow after it is merged. It queries Cloudflare's Worker deployment metadata and compares the active deployment/version information with the public `/api/health` result. It does not deploy, run SQL, or modify D1.

### Release gate
Do not claim 17.13.0 is live, and do not ship another UI redesign, until the active Cloudflare deployment/traffic metadata and the public endpoint agree. Keep all production D1 records intact.
