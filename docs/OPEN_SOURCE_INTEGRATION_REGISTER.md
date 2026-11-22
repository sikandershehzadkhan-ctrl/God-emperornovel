# Open-Source Integration Register

**Product:** Imperial Novel  
**Purpose:** Reuse proven open-source components without importing incompatible applications, weakening security, violating licences, or increasing operating costs.  
**Last verified:** 2026-11-22  
**Repository:** `sikandershehzadkhan-ctrl/God-emperornovel`

## Permanent integration policy

1. Build and own Imperial Novel's product rules, data model, authorization, publishing workflow, rights policy, payments/credits, recommendations, moderation, and user-facing product experience.
2. Reuse small, maintained libraries for commodity capabilities when they materially reduce engineering effort or improve reliability.
3. Verify the exact repository licence and the licence of every resolved dependency. A missing licence is not permission to copy.
4. Prefer MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0, ISC, and other licences explicitly allowed by `scripts/check-third-party-licenses.mjs`, subject to attribution, notice, patent, and dependency obligations.
5. Do not incorporate GPL/AGPL code into the product without explicit legal and distribution review.
6. Preserve Cloudflare Workers + D1, the existing vanilla-JS application and React islands, same-origin assets, and the zero-budget operating constraint.
7. Evaluate bundle size, mobile performance, security surface, maintenance burden, supply-chain provenance, and measurable user benefit before adding a dependency.
8. Prototype on an isolated branch, generate lockfiles with npm, run `npm ci` and the full repository build/Cloudflare dry-run, and review the actual diff before merge.
9. Never copy novels, chapters, covers, illustrations, translations, user data, or other creative works from reference platforms. Reuse only code/assets with documented permission.
10. Keep third-party packages replaceable behind Imperial Novel-owned interfaces where practical. Never let a library become the authority for product permissions, payments, rights, or publication state.

## Ownership boundary

| Capability | Ownership | Reason |
|---|---|---|
| Accounts, sessions, roles, authorization | Imperial Novel | Security and user ownership |
| Novel/chapter APIs, rights evidence, review and publication | Imperial Novel | Core product and legal workflow |
| Reader progress, bookmarks, library and history | Imperial Novel | User data and product behavior |
| Recommendations, ranking and discovery rules | Imperial Novel | Differentiation and explainability |
| Crowns, tickets, payments, royalties and ledger | Imperial Novel | Financial correctness and auditability |
| Admin, moderation, abuse controls and audit trail | Imperial Novel | Trust and platform governance |
| Editor engine, markdown/EPUB/image processing, test utilities | Reuse selectively | Commodity technical capabilities |
| Rendering, sanitization and validation policy | Imperial Novel-owned policy; libraries may assist | Untrusted content must remain under our rules |

## Verified repository status (2026-11-22)

The following work is present on `main` according to merged pull requests:

| Work | Evidence | Status |
|---|---|---|
| Integration governance and licence gate | PR [#375](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/375) | Merged |
| Structured rich-text chapter v1 policy and safe reader rendering | PR [#378](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/378) | Merged |
| Reproducible Tiptap dependency lock | PR [#379](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/379) | Merged |
| Lazy-loaded Author Studio Tiptap editor | PR [#380](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/380) | Merged |
| Cache-safe release 17.24.0 assets | PR [#381](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/381) | Merged |
| Tests against actual reader rendering functions | PR [#382](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/382) | Merged |

The editor uses `@tiptap/react@3.30.3` and `@tiptap/starter-kit@3.30.3`. The package manifest also includes React 19, React DOM, and esbuild. The lockfile is npm lockfile v3. The repository's dependency policy checks locked package licence metadata and npm registry provenance against an allowlist.

**Important:** merged source code and passing source/CI checks do not prove that production has been deployed or that the editor has passed real-device QA. Production deployment, D1 mutation, and live author/reader workflow certification are not claimed by this register.

PR [#376](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/376) remains an open draft for an earlier `imperial_text_chapter` contract. It predates and is superseded in scope by merged PR #378's `imperial_rich_text_chapter` contract. Do not merge #376 independently; close it as superseded after confirming no unique changes need preserving.

## Research candidates

| Candidate | Potential value | Licence / evidence status | Decision |
|---|---|---|---|
| [Tiptap](https://github.com/ueberdosis/tiptap) | Author Studio rich-text editing | MIT-licensed selected packages; exact locked dependency tree is checked by repository policy | **Integrated in source.** Maintain the constrained JSON contract, lazy bundle, fallback and mobile QA gates. |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization if a future feature genuinely needs HTML input | Not approved or integrated; evaluate exact licence, bundle and threat model first | Candidate only. Not a substitute for our structured-content renderer. |
| [Fuse.js](https://github.com/krisk/Fuse) | Lightweight client-side fuzzy search for bounded local datasets | Not approved or integrated; verify current licence, maintenance and search requirements | Candidate only. First measure current server/catalog search before adding it. |
| [OpenNovel](https://github.com/rishabbairagi/open-novel) | Reader/publishing workflow ideas | No verified reuse licence in prior review | Study product patterns only; do not copy code without a verified licence. |
| [Bibliogon](https://github.com/astrapi69/bibliogon) | Story bible and lore-management ideas | Licence not verified in prior review | Research workflow ideas only. |
| [Vela](https://github.com/heider-x/vela) | Long-form writing and story knowledge ideas | GPL-3.0 reported in prior review | No code reuse without legal review. |
| [OpenWrite](https://github.com/ilrein/openwrite) | Cloudflare Workers + D1 authoring patterns | AGPL-3.0 stated in prior project documentation | Architecture study only; no code transplant without legal review. |

Candidate licences and maintenance must be rechecked against the upstream repository at the time of any proposed integration. This table is not blanket approval.

## Next integration sequence

1. Complete a focused source and CI audit of the merged Tiptap editor and structured reader path.
2. Resolve the superseded open PR #376 without duplicating #378.
3. Verify real-device Android behavior, keyboard interaction, RTL editing, fallback behavior, and actual author-to-reader round trip.
4. Measure the editor bundle and ensure it remains absent from homepage and reader initial bundles.
5. Inspect the current search/catalog implementation before deciding whether Fuse.js adds value.
6. Evaluate image processing and EPUB import only after their product requirements, rights boundaries, and Cloudflare-compatible execution model are specified.
7. Keep each proposed library in its own reviewable PR with licence evidence, dependency diff, tests, and rollback path.

## Release and deployment boundary

No production deployment, production D1 mutation, or live-user workflow certification is implied by this register. Do not deploy or apply migrations as part of open-source research. Production release requires the repository's separate release gates and explicit approval.
