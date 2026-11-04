# ADR-0007: Linear integration for shared platform surfaces

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Platform architecture and platform integrator

## Context

Independent feature branches can each pass source, route and architecture checks while carrying different snapshots of the same Worker or browser bundle. Merging those branches in the wrong order invalidates source fingerprints and can silently omit newer feature handlers. The profile API and reader-progress integration exposed this failure mode.

## Decision

1. Maintain a canonical list of serialized shared surfaces in the platform integration contract, including wildcard coverage for all top-level served CSS, JavaScript and webmanifest assets.
2. During Architecture Governance, inspect earlier open pull requests and compare their changed files with the current pull request.
3. If two open pull requests overlap on a serialized shared surface, require their head commits to have an ancestor/descendant relationship.
4. Permit a newer PR to stack on an earlier PR, and permit an earlier foundation PR to remain open while a newer dependent PR is stacked on it.
5. Fail divergent overlapping PRs before merge. The contributor must stack the newer work on the earlier head, integrate the earlier work first, or close the superseded draft.
6. Keep independent feature work parallel when it does not touch the same serialized surfaces.

## Serialized surfaces

The policy covers the Worker dispatcher, identity modules, every directly served browser JavaScript and CSS asset, web manifests, service workers, migrations, route and authorization inventories, architecture decisions, platform integration contract, workflow definitions, package manifests and Wrangler configuration.

## Consequences

- PRs touching the same high-collision files are integrated in a deterministic chain.
- Source-blob fingerprints and route evidence are refreshed only after the combined Worker source is assembled.
- Independent modules remain parallelizable.
- Architecture Governance uses the read-only repository pull-request API permission to inspect open PR metadata and ancestry.
- Superseded divergent drafts must be closed rather than left as competing merge candidates.

## Rollback

If the GitHub API is unavailable, the lineage gate fails closed for protected-surface changes. Restore the previous workflow only with an explicit architecture decision and an equivalent manual integration review.
