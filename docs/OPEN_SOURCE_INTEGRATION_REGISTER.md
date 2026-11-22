# Open-Source Integration Register

**Product:** Imperial Novel  
**Purpose:** Reuse proven open-source components without importing incompatible applications, weakening security, violating licences, or increasing operating costs.

## Integration rules

1. Prefer small, maintained libraries over copying whole applications.
2. Verify the exact repository licence and the licence of every dependency before reuse. A missing licence is not permission to copy.
3. Prefer MIT, BSD-2-Clause, BSD-3-Clause, and Apache-2.0 components after checking notices, attribution, patent, and dependency obligations.
4. Do not incorporate GPL/AGPL code into the product without an explicit legal and distribution review.
5. Do not import another platform's database schema, authentication, payment, content, or user data wholesale.
6. Preserve the existing Cloudflare Workers + D1 architecture, vanilla-JS application, React islands, same-origin assets, and zero-budget operating constraint.
7. Every proposed dependency must justify its bundle cost, maintenance burden, security surface, mobile performance, and measurable user benefit.
8. Prototype in an isolated feature branch, run existing repository checks, and verify behavior before merge or deployment.
9. Never copy novels, chapters, covers, illustrations, translations, or other creative works from reference platforms. Only reuse code/assets with documented permission.

## Research candidates

| Candidate | Potential value | Licence / status | Decision |
|---|---|---|---|
| [Tiptap](https://github.com/ueberdosis/tiptap) | Modular rich-text chapter editor for Author Studio | MIT-licensed open-source core; verify each selected extension and package | **First technical pilot candidate.** Prototype a small editor island; preserve the existing chapter API and stored-content format until compatibility is proven. |
| [OpenNovel](https://github.com/rishabbairagi/open-novel) | Reader/publishing workflows, search and content presentation patterns | No verified licence file found in this review; package metadata alone does not grant reuse rights | Study product patterns only. Do not copy code until an explicit licence is verified. |
| [Bibliogon](https://github.com/astrapi69/bibliogon) | Story bible, character/location/lore management, chapter organization | Licence not verified in this review | Research workflow ideas; no code reuse until licence verification. |
| [Vela](https://github.com/heider-x/vela) | Long-form writing IDE, story knowledge and AI workflow ideas | GPL-3.0 reported by repository search | Do not copy implementation into Imperial Novel without legal review. |
| [OpenWrite](https://github.com/ilrein/openwrite) | Cloudflare Workers + D1 authoring architecture, chapter autosave and story graph | AGPL-3.0 stated in project documentation | Architecture study only; no code transplant without legal review. |

## Compatibility notes

The current Imperial Novel package manifest identifies React 19, React DOM, and esbuild as runtime/build dependencies. The product is a Cloudflare Worker-served application with incrementally mounted React islands, not a Next.js application.

Consequently:
- Do not import OpenNovel's Next.js application wholesale.
- Do not replace the Worker/D1 backend with another project's backend.
- Do not introduce a second router, authentication system, or database ownership model.
- Prefer a self-contained React island or browser-compatible module for editor functionality.
- Keep chapter submission, rights evidence, moderation, and publication approval on Imperial Novel's existing server-controlled APIs.

## First pilot: Author Studio editor

Before implementation, inspect the current author chapter form, chapter API validation, stored chapter format, sanitization/rendering path, and build pipeline.

Pilot acceptance criteria:
- Works on narrow Android screens and desktop.
- Supports essential formatting without paid extensions.
- Produces a constrained, documented content format.
- Does not allow arbitrary executable HTML or unsafe URLs.
- Preserves existing chapter limits, rights checks, draft/review workflow, and API authorization.
- Does not silently rewrite existing chapter content.
- Has tests for serialization, rendering, sanitization, and round-trip compatibility.
- Adds only necessary packages and records their exact licences.
- Passes the repository build and Cloudflare readiness checks.

## Verification status

This register records research and candidate selection only. It does not claim that any third-party code has been integrated, that the editor pilot has passed, or that production behavior has changed. Those milestones must be reported separately with their actual pull request, checks, and deployment evidence.
