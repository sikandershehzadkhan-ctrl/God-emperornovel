# ADR-0018: Refresh legacy governance registers on the canonical integration branch

**Status:** Accepted for the canonical integration candidate  
**Date:** 5 November 2026

## Context

Several open documentation PRs were authored against earlier mainline snapshots. Their durable controls remain useful, but their migration numbers, PR references, branch counts, issue states, and release observations are time-sensitive. Merging them unchanged would publish stale operational guidance and could incorrectly imply that historical branch states still describe the canonical platform.

The repository's shared-surface ownership policy requires an ADR or feature contract in the same PR when architecture-owned paths change.

## Decision

1. Preserve the legacy-schema retrofit safeguards from the older plan, but make the canonical migration sequence discoverable from the current branch rather than hardcoding historical numbers.
2. Keep legacy schema inspection read-only until a separately reviewed implementation and explicit owner approval exist.
3. Preserve the platform governance closure gates while treating branch protection, rulesets, issue states, PR dispositions, workflow results, and production state as facts that must be re-verified live.
4. Maintain the current collision register as the operational index and link the refreshed canonical documents from it.
5. Do not merge stale Worker, browser bundle, or migration histories merely to retain documentation.

## Consequences

- The new documents are durable policy references, not claims that every checklist item is complete.
- Historical PRs can be closed only after the replacement documents are accepted and the old content has been accounted for.
- No runtime code, schema, migration, production D1 resource, secret, or deployment configuration is changed by this decision.
- This decision does not authorize a production deployment or D1 migration.

## Validation

The exact PR head must pass the repository's architecture ownership, migration governance, route registry, runtime schema parity, Cloudflare source validation, and Graphify checks. A failure is a blocker to merging this documentation PR until its cause is resolved.
