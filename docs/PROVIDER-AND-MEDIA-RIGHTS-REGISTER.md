# Imperial Novel: Free Provider and Media Rights Register

Research date: 2026-10-31  
Decision owner: Product, Content & Rights, Operations, Security  
Budget rule: PKR 0. No paid APIs, subscriptions, credit-card trials, hidden usage charges, or paid fallbacks.

This is a provider evaluation, not a claim that any provider is already connected to production. A public API being reachable does not grant permission to republish the underlying work.

## Executive decision

Imperial Novel should use providers for distinct purposes rather than treat every free catalogue as a content warehouse:

1. **Metadata and discovery:** use public APIs with explicit caching, rate limits, source attribution and outbound links.
2. **Reusable media assets:** only use individual files whose exact license and attribution requirements have been verified.
3. **Reading, listening and viewing:** prioritize creator uploads and direct rights-holder partnerships. A catalogue API is not a content licence.
4. **No-cost production dependencies:** reject services that require a paid account, reserve the right to charge for our intended use, or are unsuitable for high-traffic production.

No provider in this register is authorized to supply copyrighted manga/manhwa chapters, anime episodes, commercial audiobooks or music for rehosting.

## Provider assessment

| Provider | Best use | Cost/access evidence | Rights and limits | Decision |
|---|---|---|---|---|
| Library of Congress APIs | Book, image, audio/video collection metadata and links; selected public-domain media | Public JSON/YAML API needs no API key. Official limit: 20 requests/minute for JSON/YAML; text/image services 150/minute; streaming 60/minute. | Rights vary by item. Read each item's rights statement and use permitted assets only. Do not assume all collections are reusable. | **Preferred metadata/media candidate**, item-level rights gate |
| Wikimedia Commons | Openly licensed illustrations, historical images, maps, audio and other individual media files | Public repository and MediaWiki APIs; no paid subscription needed for ordinary reuse. | Every file has its own license. Verify author, license, attribution, share-alike and non-copyright restrictions. Commons warns its licensing metadata is not guaranteed. | **Preferred asset source**, per-file verification |
| Openverse | Search/discovery of openly licensed images and audio | API registration/OAuth and rate tiers. Standard tier is available by authenticating. | Openverse aggregates third-party metadata and does not verify the license. Terms reserve the right to charge for commercial use or heavy usage. Attribution and source-platform terms still apply. | **Research-only until commercial no-fee terms are confirmed**; never treat results as automatically cleared |
| Internet Archive | Discovery and outbound links to books, audio, video and historical material | Public developer APIs and metadata access. | "Freely available" does not mean public domain or reusable. Check item-level rights, access restrictions and source terms. Do not mirror files or bypass controlled digital lending. | **Metadata/link-out only by default**; asset use only after rights review |
| Project Gutenberg | Public-domain ebook discovery and possible title-by-title text sourcing | Public ebook catalogue; no API key or paid subscription required for ordinary access. | The vast majority are public domain in the US, not necessarily in Pakistan or every territory. Confirm each title's status. Project Gutenberg name/trademark has separate terms; its permission page notes commercial use of the trademark may require royalties. Link to ebook landing pages, not deep file URLs. | **Conditional public-domain source**, no blanket ingestion |
| Standard Ebooks | High-quality public-domain ebook editions and metadata | Volunteer-driven, freely accessible project. | Confirm the underlying work's status in every relevant territory and the edition's own terms. Do not imply endorsement. | **Good candidate for carefully cleared public-domain editions** |
| Open Library | Book, author, edition and cover metadata | Public API. Default limit 1 request/second; identified apps with User-Agent and contact details 3 requests/second. | Its official guidance says APIs are not intended as a bulk backend or high-traffic commercial infrastructure. Cache; make user-driven requests; do not scrape HTML or bulk harvest. | **Small-scale user-triggered metadata lookup only** |
| AniList | Anime/manga metadata, season/series relationships and discovery links | Public GraphQL API; documented baseline 90 requests/minute, but current documentation reports temporary degraded limit of 30/minute. | Metadata API only. Not an episode, manga page or streaming licence. Respect terms, rate limits and attribution requirements. | **Promising metadata candidate**, test and cache before integration |
| Google Books API | Bibliographic search and preview availability links | Public API documentation exists; quota and current project eligibility must be checked before adoption. | Metadata and preview availability do not grant rights to copy or serve full books. | **Hold for quota/terms verification** |
| MangaDex API | Manga metadata and source links | Public API; general limit approximately 5 requests/second/IP. | MangaDex explicitly requires clients to proxy requests for CORS and image delivery, and warns that hotlinked images will not be served correctly. API availability is not proof that uploaded chapter images are licensed for republication. Proxying user traffic creates cost, abuse and rights exposure. | **Do not proxy or rehost chapters**; metadata/link-out only after policy review |
| Spotify Web API | Music metadata and user-library integrations | Official documentation says a Spotify Premium account is required to use the Web API. | Playback is Spotify's service, not a licence to stream tracks through Imperial Novel. | **Reject for PKR 0 architecture** |
| Deezer API | Music metadata | Official developer page could not be read without login during this review. | No verified free production terms or playback rights established. | **Do not adopt until terms and access are verified** |

## No-cost design and on-device reader capabilities

These are not content catalogues. They are useful supporting technologies that can reduce recurring service costs:

| Resource | Use | Licence / cost basis | Guardrail |
|---|---|---|---|
| Lucide | Consistent UI icons | Official repository uses ISC licensing for the project; selected legacy icon assets may carry their own notices. | Keep the licence notice in the source distribution; inspect any separately licensed asset. |
| Tabler Icons | Large set of UI SVG icons | Official repository states MIT licence. | Keep the MIT notice; use a curated subset and self-host the SVGs. |
| Google Fonts repository | Typography for multilingual UI and reading | Individual font folders declare their own licences, commonly SIL Open Font License. | Check the exact font's OFL file; self-host only the chosen font files to avoid a runtime font CDN dependency. |
| Browser Web Speech API | Read-aloud narration of unlocked prose | Built into supported browsers/devices; no Imperial Novel speech API account or per-request API key. | Voices and languages depend on the device/browser. Some system voices may use network services. Do not promise offline playback or audiobook-quality voices. Do not upload chapter text to a third-party TTS service. Provide stop/pause controls and respect user gestures. |

Official references:
- Lucide licence: https://github.com/lucide-icons/lucide/blob/main/LICENSE
- Tabler Icons licence: https://github.com/tabler/tabler-icons/blob/master/LICENSE
- Google Fonts source and font licences: https://github.com/google/fonts
- MDN Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

## Provider integration rules

Every proposed connector must pass these checks before it can be enabled:

- **No-cost test:** no paid account, card-required trial, usage-based bill, automatic top-up, paid overage, or paid fallback for the intended production use.
- **Purpose test:** identify whether it supplies metadata, an outbound link, a reusable asset, or licensed playable content. Do not conflate them.
- **Rights test:** store source URL, creator, license identifier and URL, attribution text, territory, permitted uses, modification rules, evidence timestamp and reviewer decision.
- **Rate-limit test:** enforce per-provider request budgets, backoff on 429, timeouts, bounded response size, caching and a global kill switch.
- **Security test:** fixed host allowlists, HTTPS, DNS/IP egress protections, no user-controlled arbitrary fetch URL, no credential leakage and no server-side proxy to untrusted hosts.
- **Reliability test:** provider outage must not break reading or discovery. Use graceful degradation and source-status labels.
- **Data governance:** retain only necessary metadata. Do not store provider content or user credentials unless the terms and product need are established.
- **Attribution:** show provider and creator attribution where required, with a direct source/license link.
- **Commercial review:** re-check terms before ads, paid Crowns, subscriptions or any commercial distribution is activated.

## Recommended free-first provider architecture

### Tier A: safe candidates for limited metadata and asset discovery
- Library of Congress: public API, strict rate limits and per-item rights review.
- Wikimedia Commons: per-file license verification and attribution.
- AniList: metadata-only integration after API terms review and caching.
- Standard Ebooks / Project Gutenberg: title-by-title public-domain review, no blanket import.

### Tier B: restricted research or link-out
- Openverse: search openly licensed candidates, but no production dependency until its commercial-use fee reservation and registration terms are resolved.
- Internet Archive: metadata and landing-page links unless an item's reuse rights are independently clear.
- Open Library: low-volume user-initiated metadata lookups only.

### Tier C: reject or defer
- Spotify Web API: Premium account requirement conflicts with PKR 0.
- Deezer: access and commercial terms not verified.
- MangaDex chapter image delivery: proxy requirement and item-level rights uncertainties make it unsuitable as a free content backend.
- Any unofficial manga/manhwa/anime scraper, raw-MTL mirror, paywall bypass, DRM bypass or bulk chapter importer: prohibited.

## Important product truth

There is no verified, universal, free-and-licensed provider in this research that grants Imperial Novel the right to republish current commercial manga, manhwa, manhua, anime episodes or commercial audiobooks. We must obtain creator submissions, explicit licences, rights-holder agreements or use content that is genuinely public domain/openly licensed for our intended use.

For now, Imperial Novel's strongest zero-budget content supply is:
- original work submitted by creators;
- commissioned/authorized works only when permission is documented;
- public-domain works after jurisdiction and edition checks;
- CC/openly licensed assets after file-level verification;
- metadata and outbound links for discovery, without copying source chapters.

## Official references

- Library of Congress APIs: https://www.loc.gov/apis/
- Library of Congress API limits: https://www.loc.gov/apis/json-and-yaml/working-within-limits/
- Wikimedia Commons reuse rules: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- Openverse API authentication/throttling: https://docs.openverse.org/api/reference/authentication_and_throttling.html
- Openverse Terms of Service: https://docs.openverse.org/terms_of_service.html
- Internet Archive Developer Portal: https://archive.org/developers/
- Project Gutenberg permissions: https://www.gutenberg.org/policy/permission.html
- Standard Ebooks: https://standardebooks.org/
- Open Library API and usage rules: https://openlibrary.org/developers/api
- AniList API rate limits: https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/rate-limiting
- MangaDex API limitations: https://api.mangadex.org/docs/2-limitations/
- MangaDex chapter image delivery: https://api.mangadex.org/docs/04-chapter/retrieving-chapter/
- Google Books API: https://developers.google.com/books
- Spotify Web API: https://developers.spotify.com/documentation/web-api

## Verification status

This document records official documentation inspected on 2026-10-31. It does not claim provider accounts have been registered, APIs connected, licences acquired, or content imported. Each integration remains disabled until its individual access, cost, rights and technical checks pass.
