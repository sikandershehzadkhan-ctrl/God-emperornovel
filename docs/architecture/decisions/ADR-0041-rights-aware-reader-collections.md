# ADR-0041: Add rights-aware reader collections as a Community-owned capability

- Status: Accepted
- Date: 2026-11-08
- Decision owners: community, platform-kernel, platform-data, platform-quality, platform-architecture

## Context

Imperial Novel has reader bookmarks and reading history, but lacks a governed way for readers to curate and share collections of eligible stories. Collections must not become a path for exposing private reading data, unpublished works, or content whose hosting rights are not cleared. The existing architecture requires explicit domain ownership, immutable forward-only migrations, route inventories, and handler-level authorization evidence for new capabilities.

## Decision

Introduce Community-owned reader collections in a dedicated Worker feature module. Store collection metadata and novel membership in two normalized D1 tables using migration 0048. Collections are private by default; public discovery returns only public collections. Private collection details are hidden from non-owners, and all mutations bind to the authenticated session owner. Membership is restricted to published novels whose rights status is original, public_domain, licensed, or authorized.

Enforce the 50-collection-per-owner and 100-item-per-collection limits with SQLite triggers so concurrent requests cannot bypass application checks. Keep the public API projection bounded and exclude invalid legacy ratings. Do not add chapter-body ingestion, external content copying, or automatic public sharing.

The initial implementation is backend-only. Reader-facing Community UI and two-account local Worker/D1 integration coverage are separate acceptance gates and must not be described as complete until implemented and tested.

## Consequences

- Community owns the collection domain module; the platform kernel composes it into the Worker.
- Platform data owns the canonical migration file and reservation; Community owns the business schema concept.
- API route/method and authorization inventories must match the exact Worker and module blob fingerprints.
- Private collections remain private unless their owner explicitly selects public visibility.
- Deleting a user, collection, or novel cascades through the collection records.
- Code rollback must preserve additive collection data; schema rollback is not permitted after deployment.

## Validation

- Run the full npm run build checks and Cloudflare dry-run validation.
- Apply migration 0048 to a fresh D1-compatible SQLite database.
- Verify database-trigger quota enforcement, duplicate membership rejection, rights-eligible novel membership, and private collection owner scoping.
- Add and pass two-account local Wrangler/D1 integration tests before runtime authorization sign-off.
- Complete the reader-facing UI as a separate implementation slice before calling the feature end-to-end complete.