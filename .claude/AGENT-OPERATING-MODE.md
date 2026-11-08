# Imperial Novel Agent Operating Mode

## Purpose
This repository includes ECC-inspired specialist agent definitions for use in a compatible Claude Code runtime. They are real, version-controlled agent profiles, not proof that any agent has already executed.

## Roles
- `chief-engineer`: planning and coordination
- `architect`: architecture and dependency map
- `frontend-ux`: UI, mobile, assets and performance
- `backend-database`: API, auth, D1 and data integrity
- `security-reviewer`: security and supply-chain review
- `qa-performance`: safe tests and regression checks
- `cloudflare-deployment`: build-to-live deployment trace
- `release-auditor`: independent release gate
- `refactor-cleaner`: evidence-based dead-code analysis

## Recommended execution protocol
1. Chief Engineer frames the task and records acceptance criteria.
2. Architect maps relevant files and dependencies before edits.
3. Independent specialists investigate in parallel when the host runtime supports native subagents. If it does not, run each profile as a separate explicit review pass and do not describe that as parallel execution.
4. Implement only after findings are reconciled; preserve a small, reviewable diff.
5. QA runs available checks and records commands/results.
6. Security and Release Auditor independently review the final diff and evidence.
7. Deploy only after required checks pass. Verify the public Worker and its served assets after deployment.

## Hard safety rules
- Never reset, recreate, truncate, or overwrite production D1.
- Never perform destructive migrations without explicit authorization, preflight, and rollback plan.
- Never expose secrets in logs or reports.
- Never delete legacy code merely because it is not currently visible. Trace references first.
- Never equate a successful build/deploy job with a verified production release.
- Do not report browser-based visual verification unless a browser/screenshot was actually used.
- Content ingestion must respect rights; metadata/RSS/API first, no unauthorized chapter-body ingestion.
- Keep all user content, ownership, settings, tickets, novels, chapters and library data intact.

## Current priority
Resolve the known release identity mismatch before further production UI changes: repository configuration had declared 17.13.0 while the public health endpoint reported 16.63.0. Trace commit, workflow, build artifact, Wrangler target, deployment result, public endpoint and served assets. Treat this mismatch as unresolved until new evidence proves otherwise.

## Host-runtime limitation
The `.claude/agents/*.md` files are compatible agent definitions for Claude Code-style agent runtimes. ChatGPT's current GitHub connector can inspect and modify repository files but does not expose a native Claude Code subagent-spawning tool. Therefore, do not claim that native subagents ran in ChatGPT. In this environment, report each performed review pass accurately and identify the tool/evidence used.
