# Imperial Novel 17.24.0: Author Studio Rich-Text Editor

## Included

- Locally bundled Tiptap 3.30.3 React editor for non-comic chapter drafts.
- Editor loads only after an author opens a chapter form in Author Studio.
- Structured content is saved as the validated `imperial_rich_text_chapter` v1 JSON envelope.
- Formatting tools include bold, italic, underline, strike, inline code, headings, paragraphs, lists, blockquotes, horizontal rules, undo/redo, and safe HTTP(S) links.
- Toolbar has 44px touch targets, accessible labels, visible focus, RTL auto direction and reduced-motion support.
- Plain-text chapter entry remains available if the editor bundle fails to load.
- Comic page composer remains a separate experience.
- Versioned 17.24.0 assets and service-worker cache key prevent stale frontend asset references.

## Security and compatibility

- Author content is never stored or rendered as arbitrary HTML.
- Worker validation remains authoritative for structured chapter documents.
- Existing plain-text and comic chapter formats remain supported.
- No D1 migration or schema change is required.
- No paid editor features, hosted services, external CDN, or AI API is introduced.

## Performance

- The editor is a separate build output and is not included in the shared reader/community bundle.
- The first measured editor bundle was 628,542 bytes raw and 198,229 bytes gzip.
- It loads only after an author opens a text chapter form, not on the homepage or reader route.

## Release boundary

This document records source and build readiness only. Production deployment and live Android device QA require a separate release decision and manual verification.
