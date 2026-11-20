# ADR-0014: Keep utility and search routes out of the public sitemap

- **Status:** Accepted for the current route baseline
- **Date:** 2026-11-18

## Context

The static sitemap included `/search`, `/omniportal`, and `/trend-factory`. Source inspection shows these are interactive utility surfaces rather than stable editorial landing pages:

- `/search` renders query-driven catalog search results and sends the query to `/api/novels?q=...`.
- `/omniportal` is a federated search tool over the local catalog and enabled, rights-authorized connectors. Imports are a separate authenticated metadata-only request.
- `/trend-factory` is a catalog-signal workspace for discovery and rights review.

These routes do not need to be offered as canonical search-engine landing pages. Query-driven search URLs can create thin or duplicative crawl surfaces, while recommendation pages can vary by signed-in user.

## Decision

- Remove `/search`, `/omniportal`, and `/trend-factory` from the static sitemap.
- Return both `X-Robots-Tag: noindex, nofollow` and a `noindex,nofollow` meta directive for these exact routes.
- Keep them publicly reachable as product utility routes. **Noindex is not authentication or authorization.**
- Keep the existing public catalog, genre, format, community, leaderboard, taxonomy, and legal pages eligible under the existing static sitemap policy.
- Preserve the rights-filtered dynamic novel and chapter sitemap generation unchanged.

## Consequences

- Search engines are discouraged from indexing utility workspaces as standalone search results.
- The route inventory and SEO regression tests explicitly record this policy.
- Future indexable landing pages must be deliberately added to the sitemap and canonical route policy; utility routes must not be added by default.
- This decision does not certify the content, access policy, or completeness of any screen.
