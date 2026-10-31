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
- If storage or the database write fails partway through an upload, the handler attempts to delete the private object. It marks the record `deleted` only after storage deletion succeeds; if deletion fails, it remains `rejected` and continues consuming quota.
- No public R2 URL is generated or returned.

## Storage quotas

- Maximum active media storage per creator: 100 MiB.
- Maximum active media storage across the platform: 1 GiB.
- Pending, uploaded, processing, ready and rejected objects count against quotas. Rejected objects continue consuming quota until their private object is confirmed deleted.
- Database triggers enforce the limits atomically, including owner changes and size/status updates. A transition to `deleted` stamps `deleted_at` and releases quota.

## Not yet implemented

Signature checks do not decode or sanitize images. Production readiness still requires a trusted image-processing pipeline that decodes and re-encodes files, limits dimensions and pixel count, strips metadata, and applies an explicit animation policy. The administrator rights-review workflow and authenticated reader-delivery endpoint now exist, but they do not make an unprocessed image safe. Until a trusted decoder/re-encoder is implemented, uploaded objects remain private and cannot be attached to comic pages because the database publication gates require `ready` plus `approved`.

## Validation

Run the repository's Cloudflare source validation workflow. It builds the Worker and runs the SQLite migration and security regression tests. This validation workflow does not deploy the Worker or modify production D1.

## Creator media library API

- `GET /api/author/media` returns the authenticated creator's own asset metadata and usage against the 100 MiB creator quota. It never returns private object keys.
- `DELETE /api/author/media/:assetId` is same-origin and owner-scoped. It refuses deletion while an asset is attached to a comic page.
- Deletion first reserves the asset in a non-publishable state, then deletes the private R2 object, and only then marks the database record `deleted`. If object deletion fails, the prior state is restored and quota remains charged. If the final database write fails after storage deletion, the reservation remains charged and the endpoint can safely retry.
- The Author Studio shows asset status, rights state, and quota usage. Upload and deletion controls remain disabled while private storage is unconfigured.

## Rights review and reader delivery routes

- `GET /api/admin/media/review-queue` is administrator-only and returns the pending rights-review queue.
- `POST /api/admin/media/:assetId/review` is administrator-only, requires a same-origin request, and accepts `approved`, `rejected`, or `withdrawn`.
- Approval requires rights-holder, license and evidence fields. The review decision and reviewer identity are written to append-only `media_asset_reviews` history in the same D1 batch as the asset state update.
- A database trigger rejects an approval state change without a matching attributable review record. Review history cannot be updated or deleted.
- `GET /api/media/:assetId` serves an object only when it is ready, rights-approved, attached to a published chapter in a published novel, and (for locked chapters) the reader has unlocked that chapter. It never accepts an object key from the client.

These routes are not a substitute for image processing. No upload path currently promotes an object to `ready`; do not manually mark unprocessed files ready. A trusted decoder/re-encoder must be implemented before any uploaded image can be published.
