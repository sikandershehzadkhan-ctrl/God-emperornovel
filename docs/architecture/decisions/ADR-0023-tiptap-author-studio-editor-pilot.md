# ADR-0023: Adopt Tiptap for the isolated Author Studio editor pilot

- **Status:** Proposed
- **Date:** 2026-11-22
- **Owners:** Frontend runtime, build toolchain, architecture contracts

## Context

Imperial Novel already uses React 19 islands and esbuild, but the Author Studio chapter composer is currently a plain-text field. The chapter API and reader now support a versioned, allowlisted structured text document. The editor must serialize to that exact schema and must not inject HTML or alter the comic chapter format.

## Decision

Prepare a local, pinned Tiptap React integration using `@tiptap/react@3.30.3` and `@tiptap/starter-kit@3.30.3`. Both upstream package manifests declare MIT. Use npm-generated lockfile v3 with exact integrity metadata; the generated dependency tree is reviewed by the repository's automated licence/provenance gate.

Pin Tiptap's optional bubble-menu and floating-menu peer packages to 3.30.3 through npm overrides so they cannot silently resolve to a later Tiptap minor version than the core packages.

The editor must be built as a separate esbuild entry and loaded only on the Author Studio route. It must not be included in the shared reader/community React island bundle or initial homepage payload.

## Required implementation constraints

- Configure StarterKit to emit only the node/mark allowlist in ADR-0022.
- Transform editor JSON to the exact `imperial_rich_text_chapter` v1 envelope before save.
- Keep link marks limited to `href`; reject unsafe schemes and credential-bearing URLs.
- Preserve a plain-text fallback if the editor chunk fails to load.
- Keep comic page composition on its existing separate path.
- Preserve existing author role, ownership, rights, draft and review controls.
- Measure the isolated bundle's raw and gzip size and verify mobile usability before adoption.

## Cost and safety

No paid Tiptap features, hosted editor service, AI API, or additional runtime service is approved. No D1 migration is required. Dependency preparation alone does not enable the editor or change production behavior.
