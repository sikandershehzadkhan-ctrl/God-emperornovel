# Imperial Novel media storage: zero-budget starting plan

## Recommendation

Use **Cloudflare R2** for publisher-owned or rights-cleared media: novel covers, comic pages, author avatars, and approved promotional images. It fits the existing Cloudflare Worker architecture and avoids storing binary image files inside the Git repository or D1 rows.

Official service pages:
- R2 overview and current pricing: https://developers.cloudflare.com/r2/
- R2 pricing and free-tier limits: https://developers.cloudflare.com/r2/pricing/
- R2 S3-compatible API: https://developers.cloudflare.com/r2/api/s3/
- Worker bindings: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

R2 has historically offered a monthly free allowance, but its quotas and pricing can change. Confirm the current pricing in the account before enabling uploads. A custom domain, if used, may have separate DNS/domain costs. Do not promise unlimited free hosting or assume that a public bucket is safe by default.

## Content support remains first-class

The existing Imperial Novel content model continues to support:
- Original novels
- Fanfiction
- Light novels and web novels
- Manga, manhwa, manhua, webtoons, comics, and graphic novels

Fanfiction must keep fandom metadata, an explicit unofficial/fan-created label where appropriate, rights declaration, moderation/takedown handling, and monetization controls. Format categories do not themselves grant publication rights. Anime, cartoons, dramas, audiobooks, and games are catalog-only until an authorized integration is configured.

## Safe media architecture

1. Store binary media in R2; keep only object keys, dimensions, MIME type, size, alt text, creator/owner, rights status, and timestamps in D1.
2. Upload through an authenticated Worker endpoint using a short-lived upload authorization or server-mediated upload. Never expose R2 access keys or account secrets in browser JavaScript.
3. Enforce per-file and per-user quotas, allowlisted image MIME types, magic-byte/content validation, image dimension limits, generated object names, rate limits, and abuse reporting.
4. Keep uploads private or unlisted until rights checks and moderation pass. Publish via a controlled Worker route or configured custom domain after approval.
5. Use lazy-loaded responsive images and WebP/AVIF derivatives where an image-processing pipeline is available. Do not proxy arbitrary user-supplied URLs from the Worker.
6. Add deletion and takedown propagation, orphan cleanup, and owner/admin audit logs before public creator uploads launch.
7. Never ingest or mirror third-party chapter images without permission; do not use this storage to bypass paywalls or source-site access controls.

## Current implementation boundary

This is the provider recommendation and implementation plan, **not an active storage integration**. No R2 bucket, credentials, upload endpoint, or production setting is created by this document. The illustrated reader currently accepts same-origin paths or HTTPS image URLs in chapter payloads. Creator uploads must remain disabled until the authenticated upload and rights-review workflow is implemented and tested.
