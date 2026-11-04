# ADR-0008: Enforce parent and rights eligibility for Author Studio chapter publication

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Creator domain and platform security

## Context

Author Studio chapter publication previously checked the novel's rights-status label but did not require the parent novel itself to be published or require supporting evidence for licensed, public-domain or authorized works. The dynamic chapter publish handler also extracted the identifier from the static `chapters` path segment, causing the route to look up an invalid chapter ID. Comic page-sequence validation ran on chapter creation but was not repeated when editing an existing comic chapter.

These gaps could leave a chapter marked published before its parent work had cleared publication review, allow non-original rights claims without evidence, bypass comic edit validation, and make the chapter publish endpoint unusable.

## Decision

1. Reuse the canonical `canPublishChapter` policy for chapter publication. A chapter can be published only when its parent novel is already published, the rights status is eligible, and non-original rights have evidence.
2. Parse the chapter identifier from the numeric route segment in `/api/author/chapters/:id/publish`.
3. Re-run `validateComicChapterContent` on every comic chapter edit as well as on creation.
4. Require chapter ticket costs to be non-negative safe integers on both create and edit.
5. Preserve the existing owner check: only the parent novel owner or an authorized administrator may edit or publish the chapter.
6. Verify the behavior through the local Worker + D1 integration test with two independent author accounts.

## Consequences

- Chapters cannot become published while their parent novel is draft or under review.
- Licensed, public-domain and authorized works require evidence before chapter publication.
- Comic page-sequence validation cannot be bypassed by editing an existing chapter.
- Fractional or unsafe ticket costs are rejected before database mutation.
- No schema migration is needed.

## Rollback

Revert the route and test changes together. Do not restore the prior rights-only publication guard, because it permits a chapter to be marked published without the parent work clearing review.
