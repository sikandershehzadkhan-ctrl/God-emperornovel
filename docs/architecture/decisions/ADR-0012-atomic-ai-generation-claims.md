# ADR-0012: Atomic AI Author Studio generation claims

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** AI domain owner and platform integrator

## Context

The existing AI Author Studio run endpoint checks a project's running status and then updates it in separate operations. Concurrent requests can pass the initial check before either update is visible, creating duplicate jobs or conflicting progress writes. A late provider response can also arrive after a replacement run has started.

## Decision

1. Acquire a run through one conditional D1 update that assigns a cryptographically random claim token and start timestamp.
2. Permit only one active claim per project; recover a claim only after its 30-minute lease has expired.
3. Bind each AI job to the claim token and require that token in every completion, project-progress, generation-history, and generated-chapter write.
4. Use one D1 batch for completion writes and discard late results when the token no longer matches.
5. Invalidate a current claim when project configuration is edited.
6. Keep generated chapters as drafts and preserve the existing rights/ownership gate before storing them against a novel.
7. Apply migration 0046 before deploying the Worker code that depends on the new columns.

## Consequences

- Simultaneous requests cannot both own the same project run.
- A late provider response cannot overwrite a newer run or create a stale chapter.
- Existing projects retain their content and progress; the change adds claim metadata only.
- Production release remains blocked until the complete canonical migration sequence and deployment workflow are reconciled.

## Validation

The feature contract defines source, migration, concurrency, and stale-worker regression checks. Exact-head CI is required before integration. No production D1 mutation is part of this decision.
