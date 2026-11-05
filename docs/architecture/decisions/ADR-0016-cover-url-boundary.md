# ADR-0016: Restrict novel cover artwork to bundled same-origin assets

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Media domain and platform kernel

## Context

Novel cover URLs were accepted from author and administrator request bodies and could point to third-party hosts. This exposes readers to third-party image requests and allows untrusted remote image sources to bypass the intended asset boundary.

## Decision

1. Accept only the built-in placeholder or one of the exact bundled cover paths under `/covers/`.
2. Apply validation server-side to author and administrator create/update handlers.
3. Render only the same allowlist in the browser; invalid or legacy external values fall back to the local placeholder.
4. Restrict the default Content Security Policy to same-origin and data images.
5. Allow HTTPS image sources only on chapter-reader routes where remote comic page media is supported.
6. Add no database migration; reuse `novels.cover_url` and existing bundled assets.

## Consequences

- Arbitrary remote image URLs are rejected before persistence.
- Author Studio uses a finite cover selector instead of a free-form URL input.
- Legacy external cover URLs may display the placeholder until replaced with a bundled cover.
- Comic reader HTTPS page media remains an explicit narrow exception.

## Validation

The cover policy test verifies the exact allowlist and rejects external, unsafe and malformed values. It also checks the four server write boundaries, CSP exception and Author Studio controls. Cloudflare CI validates the exact integration head without deploying.
