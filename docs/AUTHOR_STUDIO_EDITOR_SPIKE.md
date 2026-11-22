# Author Studio Editor Integration Spike

**Status:** Architecture inspection complete; implementation intentionally gated.  
**Target:** Add a rich-text chapter editor as an isolated React island, without changing chapter APIs or the Cloudflare Worker/D1 backend.

## Verified current architecture

- `package.json` currently depends on React 19.3.1 and React DOM 19.3.1; esbuild 0.28.2 builds browser islands.
- `scripts/build-react-islands.mjs` currently bundles `src/react/index.jsx` into the versioned `public/react-islands-<version>.js` asset.
- `src/react/index.jsx` exports the existing novel reactions, comments, and rating islands.
- `public/app-<version>.js` dynamically loads the React island bundle for community widgets.
- Author Studio itself is currently rendered by the vanilla-JavaScript `authorStudio()` flow in the versioned public app script.
- The author chapter form posts to the existing same-origin `/api/author/chapters` endpoint. New chapter drafts remain subject to the server's existing authorization, rights and review workflow.
- The current package manifest and lockfile do not include Tiptap packages.

## Proposed integration boundary

1. Implement a new `src/react/AuthorChapterEditor.jsx` React island.
2. Export a mount function from `src/react/index.jsx`.
3. Add only the required MIT-licensed Tiptap core packages as exact, lockfile-backed dependencies after a real npm lockfile generation.
4. Mount the island only inside the existing text-chapter editor slot. Leave comic page composition on its existing dedicated path.
5. Serialize to a constrained JSON document or a rigorously sanitized HTML format only after the existing API and reader rendering contract has been inspected and tested.
6. Preserve the current request payload fields: `novel_id`, `chapter_number`, `title`, `content`, `is_locked`, and `ticket_cost`.
7. Keep server authorization, chapter limits, rights evidence, draft status, moderation, and publication approval authoritative. Client validation is supplementary only.

## Required security and compatibility work

- Inspect the complete chapter POST handler and the reader's content rendering/sanitization path before choosing the persisted format.
- Ensure paste handling cannot introduce scripts, event-handler attributes, unsafe URL schemes, embedded forms, or arbitrary iframes.
- Use an explicit editor schema and allowlist for nodes, marks, and link protocols.
- Test old chapters and new editor content through save, reload, edit, and reader rendering.
- Keep existing comic chapter JSON untouched.
- Add keyboard and screen-reader labels, visible focus, touch-friendly toolbar targets, and RTL editing checks.
- Test low-memory Android browser behavior and measure the editor bundle's incremental compressed size.

## Why implementation is gated right now

The connected GitHub workflow can create repository commits and inspect files, but this session has not run npm in a checkout of the repository. Adding Tiptap to `package.json` without generating and verifying the corresponding `package-lock.json` would break the repository's `npm ci`-based build. Hand-writing a lockfile or loading editor code from a third-party CDN would be unsafe and is explicitly rejected.

Therefore this spike records the verified integration seam and the exact work required, but does not claim a working Tiptap editor, dependency installation, passing build, or production deployment.

## Completion gates

- [ ] Inspect and document server chapter validation and reader rendering contract.
- [ ] Generate the lockfile using npm in a clean checkout; commit exact package versions and licences.
- [ ] Implement the isolated Tiptap island and mount it in the existing Author Studio form.
- [ ] Add editor serialization, sanitization, round-trip, authorization-boundary, and accessibility tests.
- [ ] Run `npm ci`, `npm run build`, and `npm run build:cloudflare`.
- [ ] Review the actual built bundle size and Android usability.
- [ ] Merge only after CI and review pass; deploy separately with live verification.
