# Third-party dependency licence and provenance policy

**Owner:** Build toolchain and engineering tooling  
**Applies to:** Every npm dependency in `package.json` and `package-lock.json`  
**Budget:** No mandatory paid services or subscriptions.

## Purpose

Prevent an open-source integration from silently introducing an unknown, incompatible, copyleft, unlicensed, or non-reproducible dependency into Imperial Novel.

## Automated gate

`scripts/check-third-party-licenses.mjs` runs at the beginning of the normal `npm run build` pipeline and can be run independently with `npm run check:licenses`.

It checks:

1. npm lockfile v3 is present.
2. Every direct dependency in `package.json` matches the exact version in the lockfile root.
3. No undeclared direct root dependency is present in the lockfile.
4. Every locked package has a licence identifier.
5. Every licence identifier is in the repository's pre-approved allowlist: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD, CC0-1.0, Unlicense, or Zlib.
6. Every resolved package comes from the public npm registry.

A failure blocks the build and prints the exact package path, version, and reason.

## Manual review still required

The automated check is a guardrail, not legal advice or a complete SPDX parser. Before approving a new package:

- Inspect the exact release's LICENSE/COPYING file and upstream notices.
- Review package subpaths, optional platform packages, bundled fonts/icons/assets, and transitive dependencies.
- Verify that the licence applies to the distributed files, not merely the repository's default branch.
- Check maintenance, security advisories, provenance, and whether the package phones home or requires a paid service.
- Record attribution and preserve required notices.
- Review any dual/multi-licence expression manually. The current automated allowlist intentionally rejects unlisted expressions until they are explicitly reviewed and added.
- Regenerate the lockfile with npm. Never hand-author integrity hashes or lockfile package metadata.

## Adoption constraints

- Prefer small, maintained libraries with permissive licences.
- Do not introduce GPL/AGPL or other source-sharing obligations without explicit legal and distribution review.
- Free source code does not make hosting, APIs, email, storage, bandwidth, AI inference, or support free.
- Preserve the Cloudflare Workers + D1 architecture and zero-budget operating constraint.
- Never copy third-party novels, artwork, covers, translations, datasets, or user content without documented rights.
- No dependency may weaken authorization, rights verification, payment invariants, safe content rendering, or user-data isolation.

## Current baseline

At the time this gate was added, the lockfile contained 30 package entries and all 30 declared MIT. The direct dependency set was React, React DOM, and esbuild. This is a snapshot, not a permanent assertion; CI checks the actual lockfile on every build.

## Failure handling

A newly introduced package with a missing or unapproved licence must not be silently bypassed. The contributor must provide exact upstream evidence, update this policy/allowlist through review, and retain all required notices. Do not weaken the check merely to make a dependency installation pass.
