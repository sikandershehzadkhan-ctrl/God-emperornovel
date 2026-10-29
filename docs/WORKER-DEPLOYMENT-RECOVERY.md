# Imperial Novel production publisher recovery

## Verified blocker

The live Worker is `god-emperornovel` and the public `/api/health` endpoint reports version `16.63.0`, even though the repository contains the reviewed 17.13.0 homepage assets.

Cloudflare Workers Builds has a production trigger for this Worker:
- Trigger UUID: `f53db415-9b21-4ff7-a6b3-5a26935a776f`
- It includes branch `main` and path pattern `*`.
- Its build command still unpacks `Imperial-Novel-16.64.0-THREE-LINE-MENU-DESIGN-UPDATE.zip`.
- Its deploy command is `npx wrangler deploy`.

That is a second production publisher beside the repository's GitHub Actions deployment workflow. The read-only audit confirmed the trigger and current command. A guarded attempt to pause it was rejected with Cloudflare HTTP 403 / Authentication error using the existing `CLOUDFLARE_API_TOKEN`. No Cloudflare configuration, Worker code, or D1 data was changed by that attempt.

## Required one-time permission

The Cloudflare Workers Builds API requires a **user-scoped** API token with:
- **Workers Builds Configuration: Edit**
- **Workers Scripts: Read**

Official reference: https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/

Add this token in GitHub repository Settings → Secrets and variables → Actions as:

`CLOUDFLARE_BUILDS_API_TOKEN`

Do not paste the token into issues, pull requests, chat, workflow files, or logs.

## Pause the stale trigger

After the secret exists, run the workflow `Imperial Novel Pause Stale Cloudflare Build Trigger` from branch `investigate/cloudflare-builds-connection` with `confirm_pause=yes`. It checks that the exact trigger still points at `main` and still uses the known stale ZIP command before changing only its branch filter to a clearly named non-matching sentinel. It then re-reads the trigger and verifies the change. It does not delete the trigger, deploy Worker code, or touch D1.

If the workflow is not available for manual dispatch because it is not on the default branch, pause the trigger in the Cloudflare dashboard instead:
1. Open Cloudflare Dashboard → Workers & Pages → `god-emperornovel` → Settings → Builds.
2. Edit the production trigger identified above.
3. Change its included branch from `main` to `__disabled_until_imperial_novel_pipeline_reconciled__` and save.
4. Confirm the trigger no longer matches `main`.

## After the trigger is paused

Only then should an app-source commit trigger the GitHub Actions deployment pipeline. Its post-deploy checks must confirm:
- `/api/health` reports the expected release version and `database: true`.
- The homepage references `/app-17.13.0.js` and `/imperial-luxury-17.13.0.css`.
- The legacy `heroSideCard` and `nextQuickGrid` are absent from the live app bundle.
- The live Imperial Novel icon is served from `/imperial-novel-app-icon.svg`.

Do not reset or recreate D1, run production SQL migrations, or overwrite user content as part of this recovery.
