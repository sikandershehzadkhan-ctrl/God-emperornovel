# ADR-0031: Exercise sitemap Worker routes with mocked D1

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0024 and ADR-0030

## Context

Source-string checks verified the dynamic sitemap SQL predicates, and unit tests verified the XML renderers. Those checks did not exercise the actual Worker fetch router, status codes, query bindings, or response bodies together.

## Decision

Add a Worker-level integration test that imports the deployed Worker module and invokes its `fetch` handler with a mocked D1 binding. The test covers:
- Sitemap index page-count generation and child sitemap URLs.
- Static sitemap output from the runtime route registry, including exclusion of private routes.
- Novel and chapter sitemap response URLs and last-modified output.
- Published-state and eligible-rights SQL predicates for both count and page queries.
- Bounded page-size/offset bindings and invalid page rejection.

The test is included in the normal build test sequence.

## Evidence boundary

The mock verifies Worker routing, query construction, response behavior, and XML assembly. It does not connect to production D1, prove live database contents/rights metadata, or verify deployed CDN/cache behavior. No production data is read or changed.
