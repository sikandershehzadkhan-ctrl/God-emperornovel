# Author Studio Rich-Text Editor Pilot

**Status:** Source implementation merged; production/mobile acceptance remains outstanding.  
**Target:** A self-contained, mobile-first chapter editor using selected MIT-licensed Tiptap packages.  
**Verified source release:** Imperial Novel 17.24.0.  
**Production impact:** No production deployment or D1 mutation is claimed here.

## Implementation evidence

The source implementation was delivered through these merged pull requests:

- [PR #378](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/378): versioned `imperial_rich_text_chapter` v1 contract, Worker-side validation, safe allowlisted reader rendering, legacy plain-text compatibility, separate comic format, ADR-0022 and policy tests.
- [PR #379](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/379): npm-generated lockfile for `@tiptap/react@3.30.3` and `@tiptap/starter-kit@3.30.3`.
- [PR #380](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/380): local Tiptap React editor, separate versioned bundle, lazy loading inside Author Studio, plain-text fallback, mobile/accessibility source tests and bundle budget checks.
- [PR #381](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/381): cache-safe 17.24.0 versioned assets and service-worker updates.
- [PR #382](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/382): isolated tests executing the actual reader rendering functions.

## Security and content contract

- New rich-text chapters use a versioned structured JSON envelope, not raw author HTML.
- The Worker validates the recognized envelope on chapter creation/update.
- The reader constructs only fixed allowlisted elements, escapes author text and validates HTTP(S) links.
- Limits recorded by PR #378: 95 KB serialized payload, 3,000 nodes, depth 12, 80,000 aggregate text characters, 20,000 characters per text node, and 2,048 characters per URL.
- Allowed blocks: paragraphs, level-2/3 headings, blockquotes, ordered/unordered lists, list items, horizontal rules and hard breaks.
- Allowed marks: bold, italic, underline, strike, code and HTTP(S) links without embedded credentials.
- Existing plain-text chapters retain their legacy rendering path; comic chapters retain their separate format.
- Existing authorization, ownership, draft status, lock and publication-review behavior remain authoritative.
- No arbitrary HTML, images, embeds or code blocks are part of this pilot.

## Dependency and performance boundary

- Selected direct editor packages: `@tiptap/react@3.30.3` and `@tiptap/starter-kit@3.30.3`.
- The repository's lockfile and `scripts/check-third-party-licenses.mjs` provide dependency/version/licence/provenance checks.
- The editor is built as a separate versioned bundle and is not part of the shared reader/community React island bundle.
- The editor loads only after an author opens a non-comic chapter form in Author Studio.
- The homepage does not preload the editor.
- The plain-text field remains available until editor initialization succeeds and remains the fallback if the editor bundle fails.

## Still required before declaring the feature production-ready

- Test on real Android browsers, including a 360px viewport and the user's Vivo device where available.
- Verify toolbar touch targets, software-keyboard behavior, keyboard navigation, focus visibility and reduced-motion behavior.
- Verify Urdu, Arabic and Persian editing direction and mixed-direction text.
- Complete a real authorized author workflow: create draft, edit, save, reopen and confirm the reader output.
- Confirm legacy plain-text and comic chapters remain unchanged in real served behavior.
- Verify bundle-size report and that homepage/reader network loads do not fetch the editor bundle.
- Verify the exact release candidate's full CI and Cloudflare dry-run.
- Deploy only through the separate approved production release process, then verify live behavior.

## Superseded proposal

PR [#376](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/376) remains an open draft for an earlier `imperial_text_chapter` contract. PR #378 superseded it with the integrated `imperial_rich_text_chapter` contract and write/read enforcement. Do not merge #376 independently; close it as superseded after confirming it contains no unique changes worth preserving.

## Explicit non-claims

Merged source code is not proof of production deployment, real-device QA, or complete user acceptance. No production D1 mutation, content migration, or Worker deployment is claimed by this document.
