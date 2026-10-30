# Free Asset Policy

Imperial Novel has a **PKR 0 asset budget**. This policy applies to website UI, promotional artwork, reader themes, illustrations, icons, fonts, textures, thumbnails, and future manga/manhwa discovery experiences.

## Non-negotiable rules

1. Never purchase, subscribe to, or introduce an asset that requires payment, a paid tier, a trial, or a future licence fee.
2. "Free to download" is not proof of permission to use. Verify the licence for the exact file and intended use before adding it.
3. Commercial-use permission is required because the platform may eventually earn revenue. If commercial use is unclear or prohibited, do not ship the asset.
4. Record the source page, direct asset URL, creator, exact licence and version, attribution text, date checked, and any modifications.
5. Keep a copy of the licence or a durable licence reference with the asset where practical.
6. Prefer locally hosted, compressed, appropriately sized assets. Avoid runtime hotlinks to third-party image servers unless there is a compelling, documented reason.
7. Do not use assets with unclear provenance, scraped artwork, watermarked previews, "editorial use only" restrictions, or terms that prohibit the platform's intended use.
8. Do not remove creator credit or copyright notices when attribution is required.
9. Do not imply that a free stock image is an original Imperial Novel illustration.
10. Re-check licences when replacing, updating, or repurposing an asset.

## Preferred licence order

- Public domain / CC0.
- Creative Commons licences that permit commercial reuse and adaptation, with all required attribution and share-alike obligations met.
- Open-source asset licences that permit the intended use, such as SIL Open Font License for fonts or permissive icon-library licences.
- A provider's own free-use licence, only after reading the current terms and confirming commercial use, modification, hosting, and redistribution conditions.

Avoid CC BY-NC and other non-commercial licences for platform assets. Avoid ND licences where cropping, recolouring, optimization, or other adaptation is required. Do not assume every item on a marketplace shares the same licence.

## Candidate discovery sources

These are discovery starting points, not blanket approvals. Every individual asset still needs a licence check.

- Openverse: https://openverse.org/ (filter by licence; inspect the original source and attribution requirements).
- Wikimedia Commons: https://commons.wikimedia.org/ (check the individual file description and licence).
- Unsplash: https://unsplash.com/license (check the current Unsplash licence and any restrictions).
- Pexels: https://www.pexels.com/license/ (check the current Pexels licence and restrictions).
- Pixabay: https://pixabay.com/service/license-summary/ (check the current content licence and restrictions).
- Google Fonts: https://fonts.google.com/ (verify each font's licence; prefer SIL OFL fonts).
- Lucide: https://lucide.dev/license (verify the project licence and retain notices as required).
- Heroicons: https://github.com/tailwindlabs/heroicons (verify the current repository licence).

## Asset register

No external asset is approved merely because its source appears in the list above. Add one row per imported asset before release:

| Asset / file path | Creator | Source page and direct URL | Exact licence | Attribution required | Commercial use verified | Changes made | Date checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _No newly approved external assets recorded yet._ | | | | | | | |

## Performance and accessibility

- Prefer SVG for simple original interface symbols and CSS for decorative geometry.
- Use WebP/AVIF for photographic imagery when browser support and build pipeline permit; retain suitable fallbacks.
- Provide meaningful alt text for informative images and empty alt text for decorative images.
- Specify image dimensions or aspect ratios to reduce layout shift.
- Use responsive sizes, lazy loading below the fold, and avoid shipping oversized originals to mobile devices.
- Do not make essential navigation, text, or controls part of a raster image.
- Respect reduced-motion preferences; avoid heavy animated backgrounds and large video loops.

## Manga, manhwa, webtoon and cover-art safeguards

A publicly visible page, preview, scan, or image search result is not permission to republish it. Do not download, mirror, hotlink, translate, crop, or distribute copyrighted comic pages or covers without explicit authorization or a licence that permits that exact use. Public-domain and openly licensed works still require item-level verification. Metadata discovery must remain separate from image/content hosting rights.

## Release gate

Before shipping a new external asset, confirm:
- [ ] Exact file and source page identified.
- [ ] Licence text checked for this individual asset.
- [ ] Commercial use and intended modifications are permitted.
- [ ] Attribution and notices are included where required.
- [ ] Asset is optimized, accessible, and locally hosted where appropriate.
- [ ] Register entry is complete.
- [ ] No payment, subscription, trial, or hidden usage fee is required.
