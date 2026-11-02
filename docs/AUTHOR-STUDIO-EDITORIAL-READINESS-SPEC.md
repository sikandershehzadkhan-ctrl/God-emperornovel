# Author Studio: Editorial Readiness and Writing Goals

Status: planning specification; implementation and runtime validation are not complete.

## Purpose

Extend the existing Author Studio planning queue, chapter manager, release calendar, reader feedback inbox, and creator performance dashboard with a private editorial workspace. Help each creator decide what to write next and understand whether a draft is ready for submission, without inventing quality scores or silently changing manuscript text.

## Product boundaries

- All workspace records are scoped to the authenticated creator account and stories they own.
- Drafts and notes remain private until the creator explicitly submits or publishes through existing review gates.
- Existing novel publication approval, rights eligibility, chapter ownership, and moderation rules remain authoritative.
- No AI provider is assumed to be configured. This milestone must work without paid APIs or external services.
- Do not claim that automated checks measure literary quality, originality, or legal rights.
- Do not add author revenue, payout, or cash-balance claims.

## Proposed capabilities

### 1. Story-level writing goals

- Let a creator set an optional target for chapters or words and a target date for each owned story.
- Validate positive bounded targets and valid dates on the server.
- Show progress only from actual persisted chapter data and actual word counts.
- Clearly distinguish published words, draft words, and the creator's target.
- Permit creators to edit or remove their own goals; administrators must not gain implicit write access through this endpoint.

### 2. Editorial readiness checklist

- Provide deterministic checks for required story metadata, chapter title/number/content, supported format structure, and existing rights-evidence/publication requirements.
- Report each check as pass, needs attention, or not applicable, with a clear reason and direct link to the relevant editor.
- Keep subjective editorial quality as a human-review responsibility.
- Recompute checks from current data; do not store a stale green readiness badge.
- Never bypass admin review or publication authorization.

### 3. Private creator notes

- Allow short private notes attached to a story or chapter.
- Enforce owner scoping in every read, create, update, and delete operation.
- Bound note length and list size; escape all note text in the browser.
- Notes must never appear in public story pages, search, sitemap, reader feedback, or exports belonging to another account.

### 4. Planning integration

- Add goal status and readiness attention counts to the existing Chapter Planning Queue.
- Preserve the current separation between unscheduled draft work and scheduled releases.
- Do not duplicate scheduled chapters in the planning queue.
- Keep the 100-item bound and stable routing to the correct story/chapter editor.

## Data and API design requirements

- Inspect the current schema and runtime migration conventions before selecting tables or columns.
- Use additive, idempotent D1 migrations with foreign keys and indexes appropriate to owner/story lookups.
- Derive the creator identity from the authenticated session, never from a client-supplied user ID.
- Use guarded SQL predicates for every mutation so ownership is enforced atomically with the write.
- Return bounded, explicit response shapes and no private data belonging to other accounts.
- Add migration parity to fresh SQLite validation and the explicitly gated production deployment workflow only after review.

## Required regression coverage

- Two-account isolation for goals and notes across list/read/update/delete operations.
- Anonymous requests are denied.
- A creator cannot attach notes or goals to another creator's story or chapter.
- Malformed, oversized, negative, fractional, and out-of-range targets are rejected.
- Progress values come from actual stored chapter content and are not fabricated.
- Readiness checks do not override rights or admin publication gates.
- Scheduled drafts remain in the Release Calendar and are not duplicated in the planning queue.
- Browser rendering escapes creator note text and handles empty, loading, and error states.
- Editable and Worker-served assets remain synchronized.
- Full application build, Worker dry-run, production-safety checks, and complete SQLite migration chain pass.

## Delivery sequence

1. Inspect existing author APIs, schema helpers, UI selectors, and migration conventions.
2. Implement owner-scoped goal and private-note persistence with focused policy tests.
3. Implement deterministic readiness checks using existing publication policy functions.
4. Integrate the results into the planning queue with phone-first accessible UI.
5. Run the complete repository validation suite and inspect the final diff.
6. Open a draft PR stacked on the current Author Studio work. Do not merge, deploy, or apply remote migrations without the existing explicit release approval.

## Non-goals

- AI-generated prose or paid-provider dependencies.
- Automatic plagiarism/originality certification.
- Automated legal-rights verification.
- Creator replies to reader comments.
- Revenue sharing, withdrawals, or payout processing.
- Changes to the paused security branch.
