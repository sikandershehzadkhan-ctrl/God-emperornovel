# ADR-0005: Server-backed reader progress client integration

## Status
Proposed in draft integration PR #198. No production deployment or live D1 mutation has occurred.

## Context
The reader progress API is implemented on the governed Worker, but the browser reader still stored its progress only in local storage. The served versioned application bundle also needs to stay synchronized with the canonical source.

## Decision
- Connect the reader to the existing authenticated GET/POST /api/reading-position endpoints.
- Restore the saved percentage for the chapter currently being opened.
- Debounce scroll autosaves and include the server-issued expected_revision.
- Treat a 409 response as a conflict and do not blindly replay stale progress.
- Keep local storage as a fallback for anonymous or offline reading. Authenticated cache keys include the session account identifier, and the legacy anonymous cache is not selected until the server confirms that the session is anonymous. This prevents one account's locally cached progress from being shown to another account on a shared device.
- Recheck session identity after connectivity returns, including when the reader first opened offline; do not blindly replay stale writes.
- Keep public/app.js and public/app-17.23.0.js byte-identical and refresh the service-worker precache when the served bundle changes.
- Add a mandatory source regression test to the application build.
- Reuse the existing reading_positions entity; no numbered migration or schema fork is introduced.

## Consequences
Authenticated reading progress can synchronize through the server API. Offline reading remains locally cached and is reconciled on reconnect. Real-device, cross-account and cross-device browser QA remains required before production release.