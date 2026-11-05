# ADR-0026: Period-correct rankings and tier-list localization

**Status:** Accepted for the governed integration candidate  
**Date:** 5 November 2026  
**Owners:** Discovery experience and platform quality

## Context

The canonical 17.23 Worker already returns period-scoped chapter-unlock rankings for eligible published works. PR #248 aligned the English interface with that metric. The legacy rankings localization branch contains fourteen-locale labels but is based on the stale 17.24 bundle and describes rankings using generic catalog activity, which no longer matches the canonical ranking query.

## Decision

1. Port the fourteen-locale ranking dictionary onto the canonical 17.23 browser bundle without importing the legacy application file.
2. Preserve the existing weekly, monthly and all-time ranking API, published-rights eligibility, zero-unlock suppression and ten-point rating formatter.
3. Translate the actual chapter-unlock ranking explanation, novel/author metrics, empty states, tier labels and navigation labels.
4. Keep creator-authored titles and author names unchanged; translate only interface labels and static explanatory copy.
5. Reapply the selected interface locale after dynamic leaderboard and tier-list rendering.
6. Keep public/app.js and public/app-17.23.0.js byte-identical and add a fourteen-locale regression to the mandatory build.

## Consequences

Readers can understand rankings and tier-list labels in the selected interface language without changing ranking semantics or translating creator content. No API, database entity, migration or account preference is introduced.

## Validation

The ranking regression verifies fourteen locale dictionaries, period unlock metric text, novel and author unlock labels, dynamic result localization, empty states, tier labels, ten-point ratings and served-bundle parity.
