# ADR-0004: Validate governed integration pull requests

## Status
Proposed in integration PR.

## Context
Architecture governance and Cloudflare source validation were limited to pull requests targeting main. Nested integration pull requests targeting a governed integration branch therefore ran route and graph workflows but skipped the architecture and complete Worker build gates.

## Decision
Add the integration branch pattern to the pull_request branch filters for architecture-governance.yml and validate-cloudflare-source.yml. Mainline behavior is preserved. Push triggers remain main-only to avoid duplicate CI runs for integration branches.

## Consequences
Nested integration PRs receive the same architecture and Cloudflare source checks before being considered for promotion to main. This does not replace required branch protection or authorize merging/deployment.
