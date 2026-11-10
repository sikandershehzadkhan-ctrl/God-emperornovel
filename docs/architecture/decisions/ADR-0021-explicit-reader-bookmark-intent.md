# ADR-0021: Explicit reader bookmark intent

**Status:** Accepted for the canonical integration branch  
**Date:** 5 November 2026  
**Decision owners:** Reader domain and platform kernel

## Context

The reader currently writes a bookmark automatically whenever an unlocked chapter is opened. This conflates reading history with a deliberate save action: simply visiting a chapter can overwrite the reader's previous bookmark. The bookmark control can create a row but the canonical Worker has no matching DELETE operation, so the UI cannot reliably remove a saved bookmark.

The canonical `bookmarks` table already stores one chapter bookmark per user and novel. The existing `parseReaderProgressTarget` policy validates novel and chapter identifiers. No new table or migration is needed.

## Decision

1. Opening an unlocked chapter continues to record reading history, but never writes or updates a bookmark.
2. Only the explicit bookmark control may create or remove a bookmark.
3. Keep `POST /api/bookmark` for explicit save and add `DELETE /api/bookmark` for explicit removal.
4. Both methods require an authenticated session and validate the novel/chapter identifiers through `parseReaderProgressTarget`.
5. Derive the owner exclusively from session `u.id`. The DELETE predicate must include `user_id`, `novel_id` and `chapter_number`.
6. Permit a user to remove their own stale bookmark even if the story is no longer publicly eligible; removal is not a public content read.
7. Guests may toggle a browser-local bookmark, with no server write.
8. Expose the control's state through `aria-pressed` and keep the served versioned browser bundle byte-identical to its source.

## Consequences

- Reading a chapter no longer silently changes the saved bookmark.
- A reader can deliberately save and remove a chapter bookmark.
- Existing bookmark rows remain intact until the reader explicitly removes or replaces them.
- No migration, data rewrite, production D1 action or deployment is required.

## Validation

`scripts/test-reader-bookmark-intent.mjs` verifies that chapter visits do not write bookmarks, explicit actions use POST/DELETE, DELETE is session-owner-scoped, guest bookmark state is toggleable, the accessible state is exposed, and source/served bundles match. The API method and authorization matrices are fingerprinted to the exact Worker blob.
