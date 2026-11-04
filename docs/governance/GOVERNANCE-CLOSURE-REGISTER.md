# Governance Closure Register

**Audit date:** 2026-11-04  
**Repository:** `sikandershehzadkhan-ctrl/God-emperornovel`  
**Canonical integration target:** `main`  
**Status:** Open; evidence register, not a production approval.

## Purpose

This register is the auditable closure checklist for consolidating Imperial Novel's architecture and release governance. It deliberately distinguishes repository evidence from assumptions. A feature, branch, workflow, or security control is not considered complete merely because a proposal or implementation exists on a non-canonical branch.

## Verified repository observations

- The repository default integration target is `main`.
- Branch search returned 204 branch names across three result pages (100 + 100 + 4). This is the observed search result set, not a guarantee that every remote ref or deleted branch is represented.
- The mainline package metadata reports version `17.23.0`.
- Direct GitHub API inspection on 2026-11-04 reports `main` as **not protected** (`protected: false`; required status checks disabled; no required contexts). The repository rulesets endpoint returned an empty list. Therefore, passing CI is currently advisory rather than enforced by branch protection/rulesets; this is a confirmed governance gap, not an assumption.
- Mainline README defines the product as Imperial Novel and requires rights-cleared content, mobile-first operation, truthful metrics, and separation between passing CI, deployment, and verified production behavior.
- A governance implementation exists on `integration/shared-surface-lineage-governance-17-81`, including `.github/workflows/architecture-governance.yml`, ownership/dependency/migration checks, and a shared-surface lineage check. This is branch evidence only; it is not evidence that the workflow is present or required on `main`.
- That governance branch compares as 389 commits ahead of `main`, with 162 changed files. It must not be merged wholesale without decomposition and reconciliation.
- The governance branch's migration collision register records a canonical migration chain and explicitly says no production D1 migration has been run for the described candidate work. Verify current mainline state before acting on any allocation in that register.

## Security and integrity issue disposition

Issue #108 was re-verified against current `main` and closed as completed on 2026-11-04: the shared public-novel allowlist is wired into catalog, detail, made-for-you, recommendations and follows responses, with sentinel-based regression coverage. Its former finding is no longer an open blocker.

The following GitHub issues were confirmed as **open** during the audit and remain blockers until the fix is present on the canonical integration path and supported by reproducible tests.

| Issue | Required outcome | Current proposal (not yet merged) |
|---|---|---|
| #107 Runtime bootstrap schema consistency | Runtime-created/bootstrap schema matches canonical D1 migrations and constraints; fresh-install and upgrade fixtures pass. | PR #210 covers fresh bootstrap parity; legacy-schema retrofit remains open. |
| #109 Atomic AI generation claims | Concurrent requests cannot claim or execute the same generation job twice; idempotency and race tests pass. | PR #211. |
| #110 Bookmark/history target validation | Targets are validated against visibility and ownership before writes; cross-user and unpublished-target tests pass. | PR #212. |
| #111 Content Security Policy | Remove unsafe inline allowances where feasible; nonce/hash and real browser boot behavior are verified. | No complete remediation PR yet; inline script blocks and event-handler attributes remain to be migrated. |
| #112 Cover URL validation | Author-controlled URLs are scheme/host/size constrained; unsafe schemes and internal-network targets are rejected. | PR #213. |
| #113 Published-novel engagement guards | Follows and comment engagement writes enforce publication and visibility rules. | PR #214 consolidates follow, comment-like, and comment-report guards; PR #215 was closed unmerged to avoid shared-file collisions. |
| #114 Rating input validation | Reject non-numeric, fractional, out-of-range and malformed values before database writes. | PR #209. |
| #115 Concurrency-safe rate limits | Concurrent comment/report requests cannot bypass limits; atomic database-backed tests pass. | PR #214. |

All proposals above remain open/unmerged as of this register update. Passing CI, when obtained, will still not equal canonical integration or production verification.

Issue status must be refreshed immediately before closure. Closing an issue is not a substitute for validating the fix on the exact merged commit.

## Active security PR ownership and collision controls

| PR | Primary ownership | Shared-surface rule |
|---|---|---|
| #213 | Cover URL policy, cover rendering fallback, Author Studio cover guidance, default image CSP | Owns the cover policy module and the cover-specific build regression. |
| #214 | Community quota/report-claim schema, follow/like/report publication guards, community audit inventory, validation workflow | Owns the community schema and validation workflow. Its Worker import is kept separate from #213's cover-policy import; its new Node checks run as dedicated workflow steps, not by editing the shared package build command. |
| #208 | Governance closure register only | Documentation-only; no runtime or migration surface. |

PR #215 was closed unmerged after its follow/like changes were consolidated into #214. This is intentional collision prevention, not a lost implementation. #213 and #214 still both touch `src/index.js`, but own separate route/schema regions; verify the exact combined diff and rerun validation after either PR is integrated.

## Live shared-file collision matrix (2026-11-04)

The open PRs are independently based on `main`. They are not a merge queue and must not be merged in parallel.

| Shared path | Open PRs touching it | Integration risk / required control |
|---|---|---|
| `src/index.js` | #209, #210, #211, #212, #213, #214 | Highest risk. Route handlers, runtime bootstrap, CSP and imports share one Worker entry point. Integrate one at a time and rerun the full validation suite against the cumulative candidate. |
| `package.json` | #209, #210, #211, #212, #213 | High risk. Each branch adds a test to the same long `build` command line. These are overlapping edits to one line and can conflict or silently omit a test. Do not merge these PRs independently without first reconciling the complete build command. |
| `.github/workflows/validate-cloudflare-source.yml` | #210, #211, #212, #214 | High risk. Workflow steps must be composed cumulatively and checked for duplicate names, ordering and missing test execution. |
| `.github/workflows/deploy.yml` | #211 | Unique to the AI claim preflight proposal. Keep manual deployment gates intact. |
| `.github/workflows/production-schema-preflight.yml` | #210 | Unique to the runtime schema parity proposal. It is read-only and must remain so. |

**Safe integration rule:** do not merge by PR-number order alone. Before each merge, refresh the base, inspect the exact cumulative diff, run Cloudflare Source Validation and Graphify on the cumulative integration candidate, then re-check all later PRs against the new base. No production migration or deployment is implied by CI success.

## Mandatory closure gates

### A. Canonical source tree
- [ ] Inventory every branch across all result pages; classify as merged, active, superseded, abandoned, or archival.
- [ ] Identify the canonical source and release artifact for Worker, browser app, React islands, route registry, authorization matrix, and D1 migrations.
- [ ] No bulk merge of stale integration branches.
- [ ] Every surviving feature has one owner, one contract, and one integration destination.
- [ ] Shared-surface changes include explicit impact and owner review.

### B. Database and migration integrity
- [ ] Recompute migration sequence from `main`; do not trust branch-local numbering.
- [ ] Confirm every migration is immutable and uniquely allocated.
- [ ] Detect duplicate schema objects and semantically duplicate ledgers.
- [ ] Run fresh-install and upgrade replay against disposable SQLite/D1-compatible fixtures.
- [ ] Verify foreign keys, indexes, constraints, idempotency, and data preservation.
- [ ] No production D1 migration without a separately authorized release operation and verified backup/recovery plan.

### C. Automated governance
- [ ] Port governance checks to a small, reviewable PR based on current `main`.
- [ ] Ensure checks run for pull requests targeting `main` and for relevant pushes.
- [ ] Ensure path ownership, dependency direction/cycles, migration allocation, route/API uniqueness, and source fingerprints are tested.
- [ ] Ensure required checks are configured in GitHub branch protection/rulesets. Workflow presence alone is insufficient.
- [ ] Verify permissions are least-privilege and workflow concurrency/cancellation behavior is safe.
- [ ] Prove a deliberately invalid test fixture fails; prove a valid fixture passes.

### D. Security, privacy, and product integrity
- [ ] Resolve and test remaining open issues #107, #109-#115; #108 is closed after source and regression-test verification.
- [ ] Test two separate accounts against reader progress, library, profile, author, payment, ticket, export, and admin boundaries.
- [ ] Verify role separation and specialist approval boundaries.
- [ ] Verify rate limits and financial mutations under concurrent requests.
- [ ] Verify public API allowlists and rights/publication eligibility.

### E. Release governance
- [ ] Exact commit SHA passes required CI.
- [ ] Independent review is recorded for security-sensitive and destructive changes.
- [ ] Backup and restore evidence is current.
- [ ] Deployment and D1 migration are separate approved operations.
- [ ] Production smoke tests verify the deployed Worker and served assets.
- [ ] Rollback/forward-repair plan is documented and tested.
- [ ] No production-ready claim until production behavior is independently verified.

## Integration rules

1. Never merge a large integration branch solely because it contains useful work.
2. Compare each candidate against current `main`; inspect changed paths and shared-surface lineage.
3. Port one coherent concern at a time into a fresh branch from current `main`.
4. Re-run the complete test suite after every integration slice.
5. Reconcile registries and generated artifacts from the exact resulting source snapshot.
6. Keep unresolved collisions explicit; do not silence them by renaming, stale snapshots, or deleting tests.
7. Do not deploy or run production migrations as part of ordinary branch reconciliation.

## Current disposition

**Governance closure is not complete.** This register establishes the current audit baseline and acceptance criteria. Main branch protection is confirmed disabled and repository rulesets were empty at audit time; configuring enforceable protection requires repository administration access. Exhaustive branch classification, canonical migration replay, and production controls still require further verification. The large shared-surface governance branch remains a source of candidate checks, not an approved merge unit.
