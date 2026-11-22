# Author Studio Rich-Text Editor Pilot

**Status:** Architecture investigation complete; implementation intentionally not started.  
**Target:** A self-contained, mobile-first chapter editor using the MIT-licensed Tiptap core.  
**Production impact:** None. This document does not add packages or change runtime behavior.

## Verified current architecture

- `package.json` currently contains React 19, React DOM, and esbuild; no Tiptap packages are installed.
- `scripts/build-react-islands.mjs` bundles `src/react/index.jsx` into a versioned browser bundle.
- `src/react/index.jsx` currently exports the novel comments, reactions, and rating islands.
- Author Studio itself is rendered by the versioned vanilla-JavaScript application bundle.
- The author chapter form currently submits `novel_id`, `chapter_number`, `title`, `content`, `is_locked`, and `ticket_cost` to the existing same-origin `POST /api/author/chapters` endpoint.
- The Worker checks author access and novel ownership, validates required chapter fields, applies the comic-specific validator for comic formats, and saves new chapters with `publication_status='draft'`.
- Existing chapter records use a text `content` column. Comic chapters already have a versioned JSON envelope and dedicated validation/reader handling.

## Critical compatibility finding

The current reader's text-chapter renderer escapes the stored content before displaying it. This is safe against arbitrary HTML execution, but it means that directly storing Tiptap-generated HTML would display markup as text rather than render formatted paragraphs.

Therefore, **do not connect Tiptap by simply replacing the existing textarea and submitting HTML**. Do not use `dangerouslySetInnerHTML`, raw `innerHTML`, or an unreviewed HTML sanitizer as a shortcut.

## Recommended implementation shape

1. Add Tiptap as a locally bundled dependency. Prefer the smallest necessary open-source packages and record each exact version and licence.
2. Build a self-contained editor island that mounts only inside the existing Author Studio chapter form. Keep the existing application shell, route, author-role checks, and same-origin API.
3. Use a versioned structured-content envelope, separate from the existing comic envelope, for new rich-text chapters. Keep existing plain-text chapters readable without migration.
4. Add a Worker-side validator for the structured document. Enforce a strict node/mark allowlist, maximum document size, maximum nesting depth, maximum node count, maximum text length, and safe link protocols.
5. Render the structured document in the reader by constructing DOM nodes from the validated allowlist. Never interpret author content as executable HTML.
6. Keep chapter submission and publication review unchanged: the editor saves drafts only; it must not publish, unlock, or bypass rights/moderation rules.
7. Keep a plain-text fallback if the editor bundle fails to load. Existing chapter creation must remain possible.
8. Load the editor bundle only on the Author Studio route. Do not increase the initial homepage payload.

## Initial formatting scope

- Paragraphs and headings
- Bold and italic
- Ordered and unordered lists
- Blockquotes
- Undo and redo
- Optional safe hyperlinks, only after protocol validation
- Keyboard shortcuts and accessible toolbar labels

Exclude image uploads, embeds, arbitrary HTML, scripts, inline styles, custom extensions, collaborative editing, and paid Tiptap features from the first pilot.

## Mobile and accessibility acceptance

- Usable on a 360px-wide Android viewport without horizontal page overflow.
- Toolbar controls have at least 44px touch targets.
- Editing area has a visible label and keyboard focus indicator.
- Toolbar remains usable with the software keyboard open.
- No forced full-screen mode or hover-only controls.
- Reduced-motion preferences are respected.
- Editor initialization failure leaves a working plain-text chapter field.

## Required tests before merge

- Structured-document validator rejects unknown node and mark types.
- Rejects unsafe URL schemes, malformed JSON, excessive nesting, oversized documents, and excessive node counts.
- Reader renderer emits only allowlisted elements and safe attributes.
- Plain-text legacy chapters render exactly as before.
- Existing comic chapter validation and rendering remain unchanged.
- API tests verify author role, novel ownership, draft status, and no accidental publication.
- Build test verifies local bundle output and release-version asset references.
- Cloudflare readiness, full build, route registry, authorization registry, release consistency, and mobile/manual QA pass.

## Dependency and build gate

Do not hand-edit `package-lock.json` or guess transitive package integrity hashes. The Tiptap implementation PR must be created only when a real npm lockfile can be generated and `npm ci` plus the full build can be run. The current research environment could inspect GitHub through its connector but could not resolve GitHub from the local shell, so it could not perform a trustworthy local dependency install/build.

## Go / no-go decision

**Go:** Continue with the structured-content design and prepare a local, reproducible dependency/build environment.

**No-go for now:** Do not merge an editor that stores raw HTML, changes existing chapter formats, weakens server validation, or commits an ungenerated lockfile. No production deployment is authorized by this research.
