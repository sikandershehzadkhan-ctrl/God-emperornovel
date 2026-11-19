# ADR-0027: Exercise Reader Account Isolation Against Local SQLite

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** Identity, reader platform and security engineering

## Context

Static source contracts verified user-id predicates for reader collections, but they could not prove that two authenticated sessions actually receive and mutate disjoint account rows at runtime.

## Decision

Add a build-gated integration test that imports the real Worker fetch handler and executes its reader API routes against an isolated in-memory SQLite database through a minimal D1-compatible adapter. Seed two independent users and session tokens. Verify isolation for library, history, bookmarks, follows, and notifications, including mutations, invalid chapter/novel pairs, and unauthenticated access.

## Boundaries

This is a local SQLite integration test of the real Worker handler and SQL behavior, not a Cloudflare production D1 test. It does not replace staging tests against a real D1 binding or a full browser session test.

## Validation

Run the test with Node 22's built-in SQLite module in CI. The test must prove that each user's reads and writes remain scoped to that user's authenticated session.
