# ADR-0024: Period-correct leaderboard presentation and query support

**Status:** Accepted for the canonical integration branch  
**Date:** 5 November 2026  
**Decision owners:** Discovery domain and platform integrator

## Context

The canonical Worker already ranks eligible published novels and authors by chapter-unlock events within weekly, monthly and all-time windows. It returns the metric name and suppresses zero-unlock novel rows. The browser UI still described rankings as generic catalog activity and omitted the unlock count, making the visible explanation inconsistent with the actual ranking algorithm. The runtime bootstrap also lacked a chapter/time composite index for the correlated unlock lookup.

The older leaderboard branch contains useful UI and indexing changes, but its Worker query is not a drop-in replacement: the canonical root has additional zero-activity suppression and uses its existing ten-point rating formatter.

## Decision

1. Preserve the canonical /api/leaderboard query, period validation, rights eligibility, published-chapter filter, author normalization and HAVING unlocks>0 behavior.
2. Explain that weekly, monthly and all-time rankings are ordered by chapter unlocks in the selected period.
3. Display the period unlock count on both novel and author cards.
4. Preserve the canonical ratingText ten-point formatter.
5. Add the non-destructive runtime bootstrap index idx_unlocks_chapter_time on (chapter_id, unlocked_at) to support the chapter/time lookup.
6. Keep public/app.js and public/app-17.23.0.js byte-identical.
7. Extend the existing mandatory leaderboard regression to cover visible metric labels, unlock counts, index presence and bundle parity.

## Consequences

Readers can understand what the rankings measure, and the API's period-specific ranking behavior is reflected in the UI. The additional index is idempotently created by runtime bootstrap and does not require a numbered migration or production schema rollout in this slice.

## Validation

scripts/test-period-correct-leaderboard.mjs verifies API period and rights rules, published-chapter unlock aggregation, zero-unlock suppression, author normalization, runtime index presence, visible metric labels/counts, and source/served bundle parity.
