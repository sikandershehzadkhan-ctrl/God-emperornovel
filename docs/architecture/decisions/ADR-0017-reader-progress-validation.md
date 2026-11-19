# ADR-0017: Validate reader progress against published chapter ownership

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19

## Context

The history write route authenticated the caller and verified that the target novel was published and rights-eligible, but accepted arbitrary chapter numbers. It did not establish that the chapter existed under that novel or was itself published.

## Decision

Before writing reader history, validate positive safe-integer novel and chapter identifiers and query the joined novel/chapter pair. Both records must be published, and the novel must have an eligible rights status. Store the normalized numeric identifiers and authenticated user's ID, never a client-supplied account ID.

## Consequences

- Reader progress cannot point at nonexistent, mismatched, draft, or rights-ineligible chapters through this route.
- This is a source-level validation contract. Runtime D1 tests and two-account adversarial isolation tests remain separate release gates.
