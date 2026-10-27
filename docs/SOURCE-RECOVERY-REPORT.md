# Imperial Novel source recovery and safety review

- Product: **Imperial Novel**
- Release label: **16.64.0** (16.63.0 application source plus the three-line-menu update)
- Source was restored from the reviewed release archive into the repository root: Worker entry point, public assets, eight D1 migration files, package manifest/lockfile, and Wrangler configuration.
- Archive manifest hashes were checked before restoration.
- Worker and browser JavaScript syntax checks passed.
- The application build check passed.
- Cloudflare Wrangler bundle dry-run passed without deploying.
- All eight SQLite/D1 migration files applied cleanly to a fresh in-memory SQLite database.
- Novel-request refund ledger SQL placeholder count was corrected.
- First-admin bootstrap no longer promotes an arbitrary oldest user to administrator.
- Legacy catalog safety: adding the publication-status column to an older database defaults existing novels to published, rather than accidentally hiding the catalog. New novels are explicitly created as drafts.
- Release metadata and the browser cache-busting query are aligned to 16.64.0.
- Production D1 migrations have **not** been run.
- No production deployment has been performed.
- Production deployment is manual-only and requires an explicit confirmation input. The workflow performs source checks, a build, and a Wrangler dry-run before the actual deploy step.
- The live site has not yet been independently verified in a connected browser session; the browser connector was unavailable during this review.
