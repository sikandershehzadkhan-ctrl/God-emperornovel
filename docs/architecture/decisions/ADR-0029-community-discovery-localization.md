# ADR-0029: Community discovery localization

**Status:** Accepted for the governed integration candidate  
**Date:** 5 November 2026  
**Owners:** Community experience and platform quality

## Context

The canonical Community landing page includes quick links, a recent-discussions feed, trending stories and a personalized discovery banner. The legacy PR #136 localizes the original 18 strings across fourteen locales, but it is based on the stale 17.24 bundle and predates the current discussion-feed content and the newer ranking metric. Replacing the whole page would lose current functionality and risk translating user-generated content.

## Decision

1. Port the fourteen-locale COMMUNITY_LANG dictionary onto the canonical 17.23 browser bundle.
2. Add translations for the recent-discussions heading, rights-cleared discussion explanation, loading state, catalog link, discussion empty state and unavailable state.
3. Reapply the active locale after initial page rendering and after the trending catalog response updates the empty state.
4. Translate only static interface labels and empty/loading copy. Novel titles, usernames, discussion bodies, descriptions and other creator/community-authored content remain unchanged.
5. Preserve the existing recent-discussions API, trending catalog request, rights eligibility, navigation and card rendering.
6. Keep public/app.js and public/app-17.23.0.js byte-identical and run the community localization regression in the mandatory build.

## Consequences

Community discovery becomes readable in fourteen interface languages without changing discussion content, story metadata, routes or API behavior. No migration or new account preference is introduced.

## Validation

The Community regression verifies all 24 static strings in fourteen locales, post-render language application, discussion/catalog empty states, creator/community content preservation and source/served bundle parity.
