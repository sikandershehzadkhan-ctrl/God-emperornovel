# ADR-0012: Canonical ten-point novel rating scale

- **Status:** Proposed
- **Date:** 2026-11-07
- **Decision owners:** Product, database, API and reader-experience maintainers

## Context

The existing rating implementation is consistently constrained to 1–5 in the D1 `ratings` table, the Worker write API, the catalog minimum-rating filter, the interactive rating island and public rating labels. Imperial Novel's product requirement is a whole-number scale from 1 through 10. A display-only change would misrepresent persisted data and allow the UI and database to disagree.

## Decision

Adopt integer ratings from 1 through 10 as the canonical novel-rating scale across D1, Worker APIs, reader controls, catalog filters, ranking tiers and public labels. Zero is not a rating; novels without votes display **Not rated**.

Existing individual votes map deterministically as follows:

| Existing vote | New vote |
|---:|---:|
| 1/5 | 2/10 |
| 2/5 | 4/10 |
| 3/5 | 6/10 |
| 4/5 | 8/10 |
| 5/5 | 10/10 |

This mapping preserves vote ordering and equal spacing. It avoids fabricating odd-number values from the coarser five-point source scale. Timestamps and the unique user/novel key are preserved. Novel aggregate ratings are recomputed from migrated votes.

## Consequences

- The ratings table must enforce `CHECK(rating BETWEEN 1 AND 10)`.
- The API must reject non-integer values and values outside 1–10.
- The interactive rating island provides ten accessible, touch-sized choices.
- Catalog minimum-rating filters and tier-list thresholds must be calibrated to ten points.
- Public rating labels use whole numbers out of ten. Empty aggregates display **Not rated**, never 0/10.
- The forward migration is data-changing and must be reviewed before merge and production application.
- Production deployment remains manual. The deployment workflow must detect the old, new or unrecognized schema and verify the migrated constraint and aggregates before Worker deployment.

## Alternatives considered

1. **Multiply only the displayed aggregate by two.** Rejected because individual votes and API validation would remain five-point and inconsistent.
2. **Map existing votes to odd scores (1, 3, 5, 7, 9).** Rejected because it shifts the old five-point midpoint and maximum away from the conventional even anchors.
3. **Keep the five-point scale.** Rejected because it conflicts with the product's stated ten-point rating requirement.

## Rollout and validation

- Reserve and add a forward-only D1 migration. Do not modify applied migration files.
- Validate the migration against both a populated legacy database and a clean database with no ratings table.
- Verify vote preservation, timestamps, unique constraints, integer bounds, and aggregate recomputation.
- Run the Cloudflare source validation, migration governance and architecture workflows.
- Do not merge, apply the migration to production, or deploy without explicit release approval.
