# Zero-Cost Media Hosting Assessment

**Reviewed:** 2026-10-31  
**Use case:** rights-cleared novel covers, manga/manhwa/manhua pages, webtoon panels, and later licensed audio/video  
**Hard constraint:** no paid plan, no credit-card requirement where avoidable, no unbounded overage exposure, and no unauthorized media hosting.

## Decision

Use **ImageKit Forever Free as the first candidate for a small, rights-cleared image pilot**, subject to creating an account and validating its actual account-level limits. Keep **Cloudflare R2 as the preferred longer-term storage candidate** if the existing Cloudflare account can add an R2 subscription without requiring a paid commitment and the project can enforce hard usage controls.

This is not an unlimited free hosting solution. ImageKit's published free allowance is modest and R2 charges for usage above its included free tier. No provider has been connected, no bucket/account has been created, and no production media is being moved.

## Provider comparison

| Provider | Published free allowance / limits | Strengths | Risks and decision |
|---|---|---|---|
| ImageKit Forever Free | 3 GB DAM/media-library storage; 20 GB bandwidth/month; 25 MB image/audio/raw upload; 100 MB video upload | Explicit no-credit-card free media-hosting offer; CDN delivery; image optimization and transformations; browser upload API | Best no-card starting candidate. Fixed free limits are small; do not promise scale. Free plan does not include a custom domain. Stop or pause new uploads before quota exhaustion. |
| Cloudflare R2 Standard | 10 GB-month storage; 1 million Class A requests/month; 10 million Class B requests/month; egress free | Already in the Cloudflare ecosystem; S3-compatible and Worker binding; no egress charge | Best longer-term storage architecture, but setup requires an R2 subscription checkout. Usage beyond free allowances is billable. The r2.dev public URL is for testing, rate-limited and not production. Production public access normally uses a custom domain; a Worker proxy is possible but adds Worker request/CPU usage. |
| Backblaze B2 | First 10 GB storage free; published storage rate $6.95/TB/month; free egress up to 3x average stored data, then $0.01/GB | S3-compatible; generous egress policy | Not selected for a strict zero-budget deployment because usage beyond the allowance is billable and adds another provider. |

## Official references and verified details

- ImageKit pricing: https://imagekit.io/plans/ — Forever Free is $0/month, with 20 GB monthly bandwidth and 3 GB fixed DAM storage. The page labels the Free plan limits as fixed/monthly; the Lite tier is where overage is explicitly allowed.
- ImageKit free media hosting: https://imagekit.io/tools/free-media-hosting/ — explicitly advertises no credit card required for its free media-hosting signup.
- ImageKit upload API: https://imagekit.io/docs/api-reference/upload-file/upload-file — Free-plan maximum upload sizes are 25 MB for images, audio and raw files, and 100 MB for video. Client uploads require server-generated one-time token, signature and expiry; the private API key must never reach the browser.
- ImageKit JavaScript integration: https://imagekit.io/docs/integration/javascript — upload signature is HMAC-SHA1 over token + expiry using the private API key. The expiry must be less than one hour in the future.
- ImageKit media security: https://imagekit.io/docs/media-delivery-basic-security — private files require signed URLs or named transformations. A file uploaded as private cannot later be switched to public; it must be re-uploaded to change that state. Signed URL signatures are generated from the URL path plus expiry using the private key.
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/ — 10 GB-month, 1 million Class A and 10 million Class B requests are included monthly; egress is free; usage beyond allowances is billed.
- Cloudflare R2 setup: https://developers.cloudflare.com/r2/get-started/ — requires an R2 subscription checkout in the Cloudflare dashboard, even though included monthly usage is free.
- Cloudflare R2 public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/ — r2.dev is for non-production use; custom domains enable production caching and security controls.
- Cloudflare R2 limits: https://developers.cloudflare.com/r2/platform/limits/ — object limits are generous, but Worker inbound request limits still apply when uploads pass through a Worker.
- Backblaze B2 pricing: https://www.backblaze.com/cloud-storage/pricing — first 10 GB free, $6.95/TB/30 days after that, free egress up to 3x average stored data, and $0.01/GB above that.

## Required Imperial Novel media architecture

1. **Rights first:** upload only original, public-domain, licensed or otherwise authorized media. A URL or free download does not prove permission. Store licence/provenance and attribution evidence with the novel or chapter.
2. **Private by default:** use private ImageKit uploads. Do not expose raw permanent asset URLs from drafts or pending submissions.
3. **Server-issued upload authorization:** author/admin only; short-lived one-time token and signature generated in the Worker; private API key stored only as a Cloudflare secret. The browser receives only the public key and short-lived upload credentials.
4. **Server-side verification after upload:** never trust a browser-reported URL, file ID, MIME type, size or folder. Verify the uploaded object through the provider API before recording it.
5. **Asset registry:** add a D1 media_assets table with provider, provider file ID/path, owner, novel/chapter association, purpose, MIME type, byte size, rights basis/evidence reference, review state, and timestamps. Use stable media asset IDs in novel/chapter data, not expiring signed URLs.
6. **Signed delivery:** generate short-lived signed URLs only when returning media to the owning author/admin for drafts, or to the public when the associated novel/chapter is actually published and rights-cleared. Do not put private keys or long-lived signed URLs in client bundles or permanent D1 content.
7. **File validation:** allow only explicit MIME/extension combinations per purpose; enforce conservative app-side size limits below provider maximums; reject SVG uploads initially unless sanitized; prevent path traversal and cross-user folder access.
8. **Abuse and quota controls:** per-user upload rate limits, file-count/byte quotas, duplicate detection, admin takedown, provider usage monitoring, and an automatic upload pause before free-tier limits are exhausted.
9. **Mobile-first upload UX:** chunk/batch comic pages with progress, cancel/retry, clear per-file failures, image compression/resizing before upload where safe, and no requirement for a desktop.
10. **No fake media features:** ImageKit hosting is not an audio/video streaming product by itself. Do not mark anime, cartoons, drama, audiobooks or games as playable until a lawful provider, player, moderation workflow and cost budget exist.

## Implementation gate

Do not add provider secrets or enable uploads until an ImageKit account has been created and the dashboard confirms the Forever Free plan and its actual limits. The user should not select a paid plan, enable paid overage, or add a payment method for this first candidate. If the account's signup or dashboard requires a card or paid commitment, stop and reassess rather than proceeding.

Before production use, implement and test the Worker signing helper, author ownership checks, upload verification, D1 asset registry, private signed delivery, quota guardrails, deletion/takedown and recovery procedures. The current platform does not yet have this ImageKit integration; this document is a researched provider decision and implementation specification, not a claim that uploads are live.