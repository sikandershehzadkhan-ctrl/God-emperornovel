# Imperial Novel private media storage setup

This release adds the authenticated upload handler, but it intentionally does not activate uploads until an administrator provisions a private Cloudflare R2 bucket and binds it to the Worker.

## Required Worker binding

Create an R2 bucket named `imperial-novel-media-private` in the same Cloudflare account as the Worker. Do not enable public bucket access, a public development URL, or a custom public domain.

Add this binding to the Worker's Wrangler configuration:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "imperial-novel-media-private"
```

For a dashboard-managed Worker, add an R2 bucket binding with variable name `MEDIA_BUCKET` and select that bucket. Redeploy only after reviewing the complete release and database migration plan.

## Current security behavior

- The upload route is `POST /api/author/media/upload` and requires an authenticated author or administrator session.
- The request must be multipart/form-data with the image in the `file` field.
- Accepted formats are JPEG, PNG, WebP, AVIF and GIF, capped at 20 MiB.
- Declared MIME type is checked against file signatures.
- Objects use opaque private keys and are written only through the R2 binding.
- The database stores an asset as `uploaded` with `pending_review` rights. The upload route cannot approve rights or mark an asset ready.
- If the R2 binding is absent, the route returns HTTP 503 and does not accept the upload.
- No public R2 URL is generated or returned.

## Not yet implemented

Signature checks do not decode or sanitize images. Production readiness still requires a trusted image-processing pipeline that decodes and re-encodes files, limits dimensions and pixel count, strips metadata, and applies an explicit animation policy. A rights-review workflow and authenticated reader-delivery endpoint are also required. Until those exist, uploaded objects remain private and cannot be attached to published comic pages because the database publication gates require `ready` plus `approved`.

## Validation

Run the repository's Cloudflare source validation workflow. It builds the Worker and runs the SQLite migration and security regression tests. This validation workflow does not deploy the Worker or modify production D1.

## Rights review and reader delivery routes

- `GET /api/admin/media/review-queue` is administrator-only and returns the pending rights-review queue.
- `POST /api/admin/media/:assetId/review` is administrator-only, requires a same-origin request, and accepts `approved`, `rejected`, or `withdrawn`.
- Approval requires rights-holder, license and evidence fields. The review decision and reviewer identity are written to append-only `media_asset_reviews` history in the same D1 batch as the asset state update.
- A database trigger rejects an approval state change without a matching attributable review record. Review history cannot be updated or deleted.
- `GET /api/media/:assetId` serves an object only when it is ready, rights-approved, attached to a published chapter in a published novel, and (for locked chapters) the reader has unlocked that chapter. It never accepts an object key from the client.

These routes are not a substitute for image processing. No upload path currently promotes an object to `ready`; do not manually mark unprocessed files ready. A trusted decoder/re-encoder must be implemented before any uploaded image can be published.
