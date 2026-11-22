# ADR-0024: Mount the Tiptap chapter editor only in Author Studio

- **Status:** Proposed
- **Date:** 2026-11-22
- **Owners:** Frontend runtime, engineering tooling

## Context

The repository now contains Tiptap React and StarterKit 3.30.3 with a generated, licence-checked npm lockfile. The Worker and reader support the structured chapter envelope, but the Author Studio still uses a plain textarea.

The shared React island bundle also serves reader/community widgets. Adding the editor there would increase payload for users who never open Author Studio, especially mobile readers.

## Decision

Build the editor as a separate esbuild IIFE bundle and load it dynamically only when an eligible non-comic Author Studio chapter form is opened. Keep the plain-text textarea visible until the local bundle has loaded and mounted successfully. If loading or mounting fails, leave the textarea available as a working fallback.

Use a constrained StarterKit configuration with headings limited to levels 2 and 3 and code blocks disabled. Normalize Tiptap JSON into the exact `imperial_rich_text_chapter` v1 envelope. Link marks serialize only an `href` and accept only HTTP(S) URLs without credentials. The server validator remains authoritative.

## Accessibility and mobile

- Accessible toolbar labels and pressed states
- 44px minimum touch targets
- Visible keyboard focus
- RTL-aware editing via `dir=auto`
- No hover-only interactions
- Reduced-motion support
- Small-screen wrapping with no fixed-width toolbar

## Scope exclusions

No image uploads, arbitrary HTML, embeds, tables, collaborative editing, paid Tiptap features, AI calls, hosted services, or D1 schema changes.

## Validation

The build creates and measures the separate bundle. Tests verify that the homepage/shared reader bundle does not load the editor, the Author Studio mounts it only for text chapters, the fallback remains available, and the editor emits the server-validated schema. CI must run npm ci, the full build, Cloudflare dry-run, route registry, migration governance, and Graphify. Manual Android viewport and keyboard QA remains required before production deployment.
