# React adoption plan

## Decision

Adopt React incrementally as locally bundled, progressively enhanced UI islands. Do not rewrite the existing application in one release.

The current production frontend is a 107 KB vanilla JavaScript application served as static Worker assets. Its deployment pipeline runs `npm ci`, validates the versioned PWA asset list, and deploys the contents of `public/`. A wholesale React conversion would change the build and caching contract and could reproduce the existing blank-screen problem if the new entry point fails.

## Non-negotiable constraints

- No runtime dependency on a third-party JavaScript CDN.
- React and React DOM must be pinned in the lockfile and bundled into same-origin, versioned static assets.
- Keep the current application shell and routes working while islands are introduced.
- Lazy-load non-critical islands; keep the initial reader path small.
- Provide a visible fallback if an island fails to load.
- Respect the phone-only, zero-budget operating constraint. Use the existing GitHub Actions build and Cloudflare Worker; do not add paid services.
- Do not deploy until the normal `npm ci`, build, PWA precache, and live-browser checks pass.

## Migration sequence

1. Add pinned `react`, `react-dom`, and a small bundler as development/build dependencies; regenerate and commit `package-lock.json` using the supported CI/build environment.
2. Add a minimal React island entry and bundle it to a versioned file under `public/`. Keep the vanilla shell as the stable fallback.
3. Migrate one contained component first, such as the novel reaction controls. Verify keyboard access, touch targets, loading fallback, and no-JavaScript behavior.
4. Migrate further interactive areas only after the first island passes production checks.
5. Consider a route-level React migration only after bundle size, startup time, and Android device tests demonstrate a measurable improvement.

## Why this is staged

React is a UI library, not an automatic performance upgrade. The current app is already a static Worker application, so shipping a second full framework runtime or loading React from a CDN would increase startup cost and add an external network dependency. A locally bundled island gives the project a safe path to React without replacing working routes prematurely.

## Current status

- React migration: planned, not yet bundled or enabled.
- Reader reactions: implemented in the feature branch as a small API-backed progressive enhancement.
- Production: unchanged. This branch is not deployed.
