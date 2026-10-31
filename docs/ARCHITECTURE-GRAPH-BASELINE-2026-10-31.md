# Imperial Novel Architecture Baseline

**Date:** 2026-10-31  
**Method:** Official Graphify CLI 0.9.99, code-only extraction and clustering  
**Workflow:** GitHub Actions run 41188493040 (post-extraction refresh)  
**Artifact:** imperial-novel-graphify-6c53c2446b0efcde5230e3ae86aad514e83241fd  
**Mode:** Offline AST extraction; no model/API token; no prose, image or semantic extraction

## Measured graph

| Measure | Result |
|---|---:|
| Nodes | 678 |
| Edges | 1,012 |
| Communities | 34 |
| Extracted edges | 99% |
| Inferred edges | 9 (1%, average confidence 0.85) |
| Ambiguous edges | 0 |
| Import cycles detected | 0 |
| Token usage | 0 input / 0 output |

The refreshed graph includes the canonical Worker entry point, canonical browser application, React islands, SQL migrations, scripts/tests and GitHub Actions workflows. It also recognizes the newly extracted `src/content-formats.mjs` module. Worker source size fell from 160,514 to 158,569 bytes by moving the format registry out of the dispatcher file; the registry data and API contract remain unchanged. Generated release-stamped browser/service-worker bundles were removed **only from the ephemeral Actions checkout** before extraction, so they do not create duplicate app communities. The repository's actual generated assets were not deleted or modified.

The artifact contains graph.json, graph.html, and GRAPH_REPORT.md. GitHub Actions retains it for 14 days. It is an architecture snapshot, not a permanent source-of-truth file. Re-run the workflow after significant code changes.

## Architectural findings

### 1. Worker request dispatcher is the primary coupling hotspot

- src/index.js: 160,514 bytes, 843 lines in the checked source.
- Graphify identified the api() dispatcher as the most connected node (42 edges).
- The Worker community cohesion score remains approximately **0.07**, indicating weak internal grouping in this static graph.

**Interpretation:** The Worker currently centralizes many domains behind one dispatcher. This is not proof of a runtime defect, but it increases the cost and risk of changing unrelated domains together.

**Recommended direction:** Gradually extract domain handlers behind stable contracts: authentication/session, catalog/search, novel/chapter/reader, community/rankings, author studio, admin/moderation, tickets/donations, rights, OmniPortal and AI provider orchestration. Keep request/response shapes, authorization checks, D1 transaction boundaries and audit events unchanged during extraction. Start with small pure modules and route-level contract tests. Do not perform a one-shot rewrite.

### 2. Browser application is another major coupling hotspot

- public/app.js: 127,105 bytes, 373 lines in the checked source (many statements are densely packed).
- Graphify identified api(), esc() and boot() among the most connected browser-side nodes; esc() has 34 edges and boot() has 27.
- The browser app community cohesion score remains approximately **0.13**.

**Interpretation:** The low cohesion and compressed source make review, regression isolation and future feature work harder. This is a maintainability risk, not a measured performance score.

**Recommended direction:** Introduce explicit feature modules incrementally (shared API/error handling, routing/shell, reader, catalog/discovery, account/library, author, community, admin). Keep one shared API client and one route contract. Add focused browser smoke tests before moving each feature. Avoid a framework rewrite solely to improve the graph.

### 3. Existing modular boundaries are useful and should be preserved

Graphify found distinct modules for password hashing, connector URL policy, donation submission/approval policy, donation reference indexing, runtime feature schema initialization, and author-application validation. The creator application feature now has a separate policy module, D1 application table, reader application page and admin review queue. The canonical content-format registry is now also a separate `src/content-formats.mjs` module, with its own unit test and a regression test that validates the server API against the extracted registry. Their focused communities are stronger than the two main application hubs. Preserve and expand this pattern where domain logic is pure and independently testable.

### 4. Database and rights boundaries are visible

The graph includes the initial schema and migrations for OmniPortal, publishing, legal/rights controls, AI Author Studio, and discovery/community. The rights migration forms a focused community. Continue treating rights provenance, publication state, payment state, and audit history as explicit domain boundaries. Do not collapse these into generic metadata or trust a source URL as proof of permission.

### 5. No import cycles were detected

This is a useful static result, not proof of runtime correctness, secure authorization, correct D1 transactions, or absence of circular behavior through dynamic imports and runtime callbacks.

## Product-critical issues not solved by architecture cleanup

1. **Content supply:** production currently exposes one published story and two chapters. This is the biggest platform viability gap. The correct response is a rights-cleared creator and editorial pipeline, not scraped or fabricated catalog entries.
2. **Production/source drift:** source is now 17.22.0 and includes the `/discover` alias, author applications, and migrations 0009–0011. Production was still 17.20.0 in the latest read-only check, and direct `/discover` returned the branded 404. Source validation passing does not deploy it.
3. **Feature truthfulness:** anime, cartoons, audiobooks, dramas and games are catalog-only placeholders in the current format registry. They must not be described as playable/integrated. Comic chapter rendering is implemented for a structured page payload, but a format reader is not the same as a licensed content supply.
4. **Performance evidence:** no trustworthy LCP, INP, CLS, or mobile network profile has yet been captured. Tool-side fetch duration is not a Core Web Vital or definitive Worker TTFB.

## Next engineering sequence

1. Preserve the passing source-validation workflow and its read-only production safeguards. The 17.22.0 creator onboarding source and the subsequent content-format extraction both have passing Graphify/source-validation runs; one intermediate build failed because the extraction commits briefly landed out of order, then passed after the missing module was added.
2. Fix and deploy the source/production route mismatch only through the reviewed production workflow, then verify direct routes on the live Worker.
3. Add route-level API contract tests around the existing dispatcher before extracting domain modules.
4. Modularize Worker domains one at a time, beginning with low-risk pure policies and keeping authorization/transaction behavior unchanged.
5. Modularize the browser application behind stable route and state contracts; measure actual mobile performance before and after.
6. Prioritize rights-cleared publishing and author onboarding to grow the real catalog.
7. Use the researched ImageKit Forever Free candidate only after account-level no-card/free limits are confirmed; keep uploads disabled until private upload verification, asset registry, signed delivery and quota controls are implemented.
8. Re-run Graphify after each substantial architectural milestone and compare graph snapshots. Do not optimize for graph scores alone.

## Limits

Graphify code-only mode parses supported source syntax; it does not understand every business rule, runtime binding, SQL query plan, authorization path, browser interaction, or legal permission. This report must be paired with tests, live browser checks, D1 audits, security review and product/rights review. Static graph output is evidence for where to inspect, not a verdict that a component is safe or broken.