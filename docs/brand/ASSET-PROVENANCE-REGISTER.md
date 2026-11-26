# Imperial Novel public asset provenance register

- **Audit date:** 2026-11-26
- **Audited ref:** `main` at repository audit time
- **Scope:** Raster/vector/icon/font-like visual files under `public/`
- **Result:** 19 matching files found. This is a repository inventory, not proof of ownership or licence clearance.

## Evidence standard

A Git commit proves that a file entered or changed in repository history. It does not prove who created the artwork, whether the creator assigned rights, whether an external source was used, or whether commercial reuse is permitted. A matching file hash proves byte identity, not authorship.

Status meanings:
- **Documented third-party source:** a notice identifies the upstream project and licence. The source remains third-party; preserve its licence.
- **Original-looking source, authorship unverified:** source is present as SVG and appears bespoke to Imperial Novel, but no signed creator/provenance record was found in this audit.
- **Unverified binary provenance:** repository history and file presence are known, but creator/source/licence cannot be established from the available text records.
- **Duplicate alias:** identical file bytes to another asset; the original provenance question still applies.

## Inventory

| File | Format | Size | Observed repository evidence | Provenance status |
| --- | --- | ---: | --- | --- |
| `public/apple-touch-icon.png` | PNG | 508,895 B | Added in source-recovery commit `91d2f6b` (2026-10-27) | Unverified binary provenance |
| `public/covers/ascendant.jpg` | JPEG | 767,841 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/cartographer.jpg` | JPEG | 1,044,042 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/ember.jpg` | JPEG | 799,688 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/glass.jpg` | JPEG | 1,215,053 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/isekai.jpg` | JPEG | 804,749 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/mercy.jpg` | JPEG | 832,382 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/neon.jpg` | JPEG | 1,035,086 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/covers/swords.jpg` | JPEG | 812,532 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/favicon.ico` | ICO | 17,736 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/favicon.svg` | SVG | 455 B | Source is an eclipse/crown/throne mark in turquoise/violet; added in `91d2f6b` | Original-looking source, authorship unverified |
| `public/imperial-character.png` | PNG | 577,595 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/imperial-crown-icon.png` | PNG | 508,895 B | Identical Git blob to `public/apple-touch-icon.png` | Duplicate alias; source provenance unverified |
| `public/imperial-hero.png` | PNG | 1,204,340 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/imperial-novel-app-icon.svg` | SVG | 2,388 B | SVG contains an eclipse and empty-throne composition; history includes identity refresh commits `98f09d5` and `1ed9009` | Original-looking source, authorship unverified |
| `public/imperial-novel-crest-17.18.0.svg` | SVG | 2,332 B | Versioned eclipse/throne crest; source history was not independently established in this pass | Original-looking source, authorship unverified |
| `public/imperial-novel-crest.svg` | SVG | 1,877 B | SVG contains crown, throne, violet field and turquoise arcs; added in `91d2f6b` | Original-looking source, authorship unverified |
| `public/imperial-search-icon.png` | PNG | 394,195 B | Added in `91d2f6b` | Unverified binary provenance |
| `public/story-cover-placeholder.svg` | SVG | 2,084 B | SVG placeholder with crown/throne motif; commit `cf96250` (2026-10-28) | Original-looking source, authorship unverified |

## Third-party icon source

`THIRD-PARTY-NOTICES.txt` documents selected inline SVG navigation icon paths adapted from Lucide Icons under the ISC licence. This notice is the current recorded third-party icon provenance. Preserve the copyright and permission notice. Do not describe these adapted paths as wholly platform-authored or exclusively owned by Imperial Novel.

## Audit findings

1. The asset policy says no external asset is approved merely because a discovery source is listed, and its register has no newly approved external assets.
2. The notice file documents Lucide, but does not identify the creator/source/licence for the 19 files inventoried above.
3. The 8 story-cover JPEGs and 3 non-duplicate PNG illustrations are not cleared by their filenames or by the source-recovery commit message.
4. The app-icon and crest SVGs are editable source files and contain Imperial Novel-specific composition, but repository history alone does not establish authorship or assignment.
5. `apple-touch-icon.png` and `imperial-crown-icon.png` are byte-identical. The duplicate naming should be consolidated only after references and release-cache behavior are reviewed.
6. The legacy `favicon.svg` uses a different turquoise/violet treatment from the newer app-icon direction. This is a brand-consistency finding, not a finding of infringement.

## Required resolution before an ownership claim

For each unverified item, record one of:
- Created by the platform owner: retain dated editable source and a signed authorship/assignment record appropriate to the creator relationship.
- Created by a contractor: retain the written rights assignment/licence and source-delivery evidence.
- Third-party licensed: record the exact original source page, creator, licence/version, commercial-use permission, modifications, attribution, and date checked.
- Creator-submitted story/cover art: retain the creator's agreement and the platform's specific hosting/display permission; do not claim the artwork as platform-owned.
- Unknown or uncleared: quarantine from public use and replace with a newly commissioned/original asset or a verified commercially usable asset.

Do not silently delete or replace current production assets as part of this documentation audit. Removal/replacement requires a separate impact review of references, cache versions, and the deployed build.

## Limitations

This pass inspected GitHub's text metadata, asset paths, sizes, hashes, SVG source text, commit history, and repository notices. It did not download/render the raster binaries, identify visual similarity to third-party works, inspect creator correspondence, or obtain legal advice. Therefore no claim is made that any unverified asset is infringing or that any unverified asset is cleared.
