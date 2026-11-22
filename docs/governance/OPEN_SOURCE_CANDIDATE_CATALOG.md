# Imperial Novel Open-Source Candidate Catalog

**Research date:** 2026-11-22  
**Status:** Candidate inventory, not an approved dependency manifest.  
**Product constraints:** Cloudflare Workers + D1, versioned same-origin assets, vanilla-JS application with React islands, mobile-first Android support, rights-safe publishing, and zero budget.

## How to read this catalog

- **Free source** means the upstream code is publicly available under a stated licence. It does not mean hosting, inference, email, storage, bandwidth, or API usage is free.
- Licence labels below are preliminary repository-level signals. Before adoption, verify the exact release tag, LICENSE/COPYING files, notices, bundled assets, extensions, and complete transitive dependency tree. A missing or ambiguous licence means no code reuse.
- **Adoption status** is deliberately conservative. No candidate in this catalog is claimed to be installed or production-tested unless explicitly stated.
- Prefer small libraries and standards over importing complete applications.

## A. Author Studio and content creation

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| Tiptap | https://github.com/ueberdosis/tiptap | MIT core; extensions vary | Rich-text chapter editor, toolbar, structured content | First isolated pilot; no raw HTML storage |
| Lexical | https://github.com/facebook/lexical | MIT | Alternative editor framework | Evaluate only if Tiptap fails product requirements; do not install both |
| ProseMirror | https://github.com/ProseMirror/prosemirror | MIT | Structured document model and editor primitives | Technical reference or alternative editor foundation |
| Milkdown | https://github.com/Milkdown/milkdown | MIT | Markdown-oriented rich-text editor | Alternative authoring direction; assess bundle and mobile UX |

## B. Reader, publishing and document formats

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| epub.js | https://github.com/futurepress/epub.js | BSD-family; verify exact licence | EPUB rendering and navigation | Later optional EPUB capability |
| Readium | https://github.com/readium | Multiple project licences | EPUB and digital publication standards | Study individual projects; review each licence |
| Paged.js | https://github.com/pagedjs/pagedjs | MIT | Print and paginated book output | Optional export/print workflow |
| Workbox | https://github.com/GoogleChrome/workbox | MIT | Service-worker caching and PWA support | Use only after cache privacy and offline rights rules are designed |

## C. Internationalization, RTL and accessibility

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| i18next | https://github.com/i18next/i18next | MIT | UI translations and language switching | Strong candidate if current locale layer needs it |
| FormatJS | https://github.com/formatjs/formatjs | MIT | Locale-aware dates, numbers, plurals and messages | Adopt only for missing formatting requirements |
| Unicode CLDR | https://github.com/unicode-org/cldr | Unicode licence family | Locale data and formatting conventions | Standards/reference data; verify data notices |
| axe-core | https://github.com/dequelabs/axe-core | MPL-2.0 | Automated accessibility checks | Add to QA, not production runtime |
| Radix UI Primitives | https://github.com/radix-ui/primitives | MIT | Accessible dialogs, menus and popovers | Selective React-island use; avoid duplicating existing components |
| Ark UI | https://github.com/chakra-ui/ark | MIT | Accessible headless component behavior | Alternative to Radix, not a companion dependency |
| Lucide | https://github.com/lucide-icons/lucide | ISC | Consistent icon assets | Already represented by adapted inline SVG paths and THIRD-PARTY-NOTICES.txt; avoid unnecessary runtime icon package |

RTL acceptance must cover Urdu, Arabic and Persian, mixed-direction text, punctuation, numerals, selection, cursor movement, and chapter direction independently from interface language.

## D. Validation, sanitization and application security

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| Zod | https://github.com/colinhacks/zod | MIT | Runtime validation for API and structured content | Candidate; compare with existing validators before adding |
| DOMPurify | https://github.com/cure53/DOMPurify | MPL-2.0 | HTML sanitization where HTML is genuinely required | Not a substitute for a strict structured-content schema |
| OWASP Cheat Sheet Series | https://github.com/OWASP/CheatSheetSeries | CC BY-SA family | Security implementation guidance | Reference material, not runtime dependency |
| OWASP ASVS | https://github.com/OWASP/ASVS | CC BY-SA family | Security verification requirements | Use to organize security audits |

Never weaken server-side authorization, rights checks, upload validation, payment invariants, account isolation, or safe chapter rendering to accommodate a library.

## E. Testing, build and software supply chain

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| Vitest | https://github.com/vitest-dev/vitest | MIT | Unit and integration tests | Candidate for test stack consolidation |
| Playwright | https://github.com/microsoft/playwright | Apache-2.0 | Browser, route and end-to-end tests | Strong QA candidate; CI browser installation has resource cost |
| Lighthouse | https://github.com/GoogleChrome/lighthouse | Apache-2.0 | Performance, SEO and accessibility audits | CI/manual QA tool |
| OpenSSF Scorecard | https://github.com/ossf/scorecard | Apache-2.0 | Upstream repository security posture | Supply-chain review |
| CycloneDX cdxgen | https://github.com/CycloneDX/cdxgen | Apache-2.0 | Software bill of materials | Generate dependency inventory during release QA |
| esbuild | https://github.com/evanw/esbuild | MIT | JavaScript bundling | Already used by the project; retain current build boundary |

## F. Cloudflare and data architecture

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| Workers SDK / Wrangler | https://github.com/cloudflare/workers-sdk | Apache-2.0 family | Local development, build and deployment tooling | Existing platform toolchain; preserve current deployment gates |
| workerd | https://github.com/cloudflare/workerd | Apache-2.0 | Workers runtime behavior and local testing | Use through supported tooling; no separate production runtime |
| Drizzle ORM | https://github.com/drizzle-team/drizzle-orm | Apache-2.0 | Typed D1/SQLite access | Evaluate only against current SQL and migration governance |
| Kysely | https://github.com/kysely-org/kysely | MIT | Typed SQL query construction | Alternative to Drizzle; do not add both without a concrete need |
| OpenTelemetry JS | https://github.com/open-telemetry/opentelemetry-js | Apache-2.0 | Instrumentation standards | Research only until Workers-compatible, no-cost telemetry is proven |

## G. Discovery and recommendation research

| Candidate | Upstream | Preliminary licence signal | Potential use | Decision |
|---|---|---|---|---|
| Microsoft Recommenders | https://github.com/recommenders-team/recommenders | MIT | Recommendation algorithms and evaluation examples | Port concepts only where compatible; Python service hosting is not assumed free |
| Meilisearch | https://github.com/meilisearch/meilisearch | Verify current exact licence and hosting model | Typo-tolerant full-text search | Research-only; external hosting is not included in zero-budget assumption |
| Typesense | https://github.com/typesense/typesense | GPL-family; verify exact version | Search server | Do not integrate without licence and hosting review |

## H. Existing project facts and adoption boundaries

Verified from the current project manifest and repository documentation:

- The application uses React and React DOM 19 plus esbuild.
- The application is served through the Cloudflare Worker and uses D1.
- React islands are bundled into versioned browser assets.
- Author Studio's existing chapter form uses the existing same-origin author API.
- Existing text chapter content is escaped in the reader. Raw editor HTML must not be inserted directly.
- Comic chapter content has a separate versioned format and validator.
- Lucide-derived inline SVG paths already have a third-party notice.
- The project has a canonical root-path ownership registry and migration governance. New files must have exactly one owner.

## I. Mandatory adoption gate

A candidate moves from research to implementation only when all of these are recorded:

1. Exact upstream repository, release tag and commit SHA.
2. Exact licence text and copyright/attribution requirements.
3. Licences for selected extensions, assets and every transitive dependency.
4. Security advisories, maintenance signals and supported runtime.
5. Measured compressed bundle impact and Android memory/performance impact.
6. Hosting, API, storage, bandwidth and inference costs; reject any mandatory paid dependency.
7. Integration owner, source path, dependency direction and architecture contract.
8. Existing tests plus new tests for authorization, user isolation, rights, RTL, accessibility and regressions.
9. Generated lockfile from a clean install; never hand-edit lockfile integrity data.
10. Pull request checks pass. Production deployment and D1 changes remain separate, explicit release decisions.

## J. Explicit exclusions

- No importing whole competing novel platforms or their databases.
- No copying copyrighted novels, chapters, covers, artwork, translations or user data.
- No paid Tiptap extensions, paid AI APIs, hosted search subscription or mandatory commercial analytics.
- No raw HTML chapter storage or unsanitized HTML rendering.
- No new database, router, authentication system or deployment pipeline merely because an upstream project uses one.
- No claim of integration, test success or deployment without corresponding evidence.

## Current adoption status

- Research register: proposed in PR #375.
- Tiptap: architecture pilot documented; implementation not started.
- Other candidates: research-only pending exact-version licence, compatibility, cost and dependency review.
- Runtime dependencies added by this catalog: zero.
- Production deployments or D1 mutations from this catalog: zero.
