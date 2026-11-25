# ADR: Coordinated Tiptap security dependency upgrade

- **Status:** Proposed
- **Date:** 2026-11-23
- **Decision owner:** Build and release engineering owner
- **Integration owner:** Platform release owner
- **Scope:** Author Studio rich-text editor dependency graph

## Context

The repository's previous Tiptap dependency set used version 3.30.3. The dependency audit reported 27 findings in the Tiptap dependency tree (26 moderate and 1 high). The high-severity advisory GHSA-j95f-988m-3j2f concerns regular-expression denial of service in Markdown attribute parsing; the moderate advisory GHSA-cp6q-959q-f8rh concerns unsafe `__proto__` handling in `mergeAttributes`. The upstream fixes are included in later Tiptap releases.

A partial override-only update was not sufficient: it left peer/version alignment problems and continued to report vulnerabilities. The editor packages and menu extensions therefore need a coordinated version.

## Decision

Upgrade the direct Tiptap packages and the Bubble/Floating Menu overrides together to **3.35.0**:

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-bubble-menu` override
- `@tiptap/extension-floating-menu` override

Regenerate `package-lock.json` with npm and keep the Author Studio bundle contract aligned with the selected release. Do not suppress advisories or use hand-edited lockfile records.

## Verification required

The change is acceptable only when all of the following pass on the proposed PR head:

1. Clean `npm ci` install.
2. `npm audit --audit-level=low` reports zero vulnerabilities.
3. The full Cloudflare build and readiness checks pass. The repository's `build:cloudflare` script uses Wrangler `--dry-run`; it must not deploy.
4. The Author Studio editor bundle contract passes, including raw and gzip size reporting.
5. Route registry, Graphify, and migration/ownership governance workflows pass.
6. The lockfile and package declarations resolve to the same Tiptap version family.

## Consequences and safeguards

- The editor dependency tree receives upstream security fixes without adding a paid service or runtime provider.
- The change affects build-time/browser editor dependencies only; it does not change D1 schema, user data, Worker bindings, or production configuration.
- The bundle size remains subject to the existing Author Studio bundle contract.
- If verification fails, keep this change unmerged and revise or revert the dependency update on its branch.
- This ADR does not authorize merging, production deployment, or production database operations. Those remain separate, explicitly approved release actions.

## References

- [GHSA-j95f-988m-3j2f](https://github.com/advisories/GHSA-j95f-988m-3j2f)
- [GHSA-cp6q-959q-f8rh](https://github.com/advisories/GHSA-cp6q-959q-f8rh)
- [Tiptap v3.30.5 release](https://github.com/ueberdosis/tiptap/releases/tag/v3.30.5)
