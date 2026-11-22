# ADR-0022: Versioned, allowlisted rich-text chapter documents

- **Status:** Proposed
- **Date:** 2026-11-22
- **Owners:** Worker runtime, frontend runtime, architecture contracts

## Context

Author Studio currently stores chapter content in the existing D1 text column. Plain-text chapters are escaped by the reader. Comic chapters use their own versioned JSON envelope and validator. A rich-text editor must not store arbitrary HTML or change legacy comic/plain-text behavior.

## Decision

Introduce an optional `imperial_rich_text_chapter` version 1 JSON envelope. Its document model is compatible with a constrained Tiptap/ProseMirror JSON schema: paragraphs, level-2/3 headings, blockquotes, ordered/unordered lists, list items, horizontal rules, hard breaks, text, and a small mark allowlist. Links are limited to HTTP(S).

The Worker validates marked rich-text envelopes on both chapter creation and update. Legacy plain text continues through the existing path. Comic formats continue to use their independent comic policy. The reader renders the allowlisted structure by constructing only fixed HTML elements and escaping every text and URL value; it never inserts author-supplied HTML.

## Limits

- 95 KB serialized document
- 3,000 nodes
- 12 levels of nesting
- 80,000 aggregate text characters
- 20,000 characters per text node
- 2,048 characters per link URL
- Heading levels 2 and 3 only

## Consequences

This creates the persistence, validation, and reader compatibility boundary needed for a later locally bundled Tiptap editor. It does not itself install Tiptap or claim a rich-text editing UI. No D1 migration is required because the existing content column stores the versioned JSON string. No production deployment is included.
