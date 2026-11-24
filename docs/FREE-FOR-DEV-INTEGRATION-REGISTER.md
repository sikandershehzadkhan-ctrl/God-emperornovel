# Free-for-dev service evaluation register

**Status:** Research register; no external service is approved or integrated by this document.  
**Last reviewed:** 2026-11-24  
**Product:** Imperial Novel  
**Production baseline:** Cloudflare Workers + D1; same-origin application assets; zero-budget constraint.

## Purpose

Use the community-maintained [free-for-dev directory](https://github.com/ripienaar/free-for-dev) as a discovery index for developer services that may have a genuinely usable free tier. It is not software to install into this repository, and a listing is not an endorsement or a guarantee that a provider's offer is still available.

Use the canonical upstream repository above. Search results and old mirrors/forks can show stale copies. Re-check the provider's own current pricing, terms, privacy policy, security documentation, regional availability and service status before relying on any listing.

## Non-negotiable acceptance gates

A candidate must pass every applicable gate before production adoption:

1. **Price:** A continuing free tier, not a trial; no required credit card, paid upgrade, usage overage, or hidden recurring commitment for the intended workload. Record hard quotas and what happens at quota exhaustion.
2. **Commercial permission:** Terms permit use by a public platform that may eventually earn revenue. "Free for personal use" is insufficient.
3. **Privacy:** Identify data collected, processing location, retention, deletion, subprocessors, and whether user content is used for training or advertising. Do not send chapter text, private messages, credentials, payment details, or personal data to an unapproved provider.
4. **Security:** HTTPS, access controls, secret handling, incident history/disclosure, and an acceptable data-processing agreement where needed.
5. **Architecture:** Must work with Cloudflare Workers/D1, the current vanilla-JS application and React islands, and mobile/low-bandwidth requirements. Prefer same-origin and standards-based integrations.
6. **Reliability and exit:** Document availability limits, rate limits, support, export, portability, lock-in, and a graceful fallback if the provider disappears or changes its free plan.
7. **Licensing:** For code or self-hosted software, review the exact repository licence, dependencies, notices, maintenance, vulnerabilities and compatibility. Never copy code merely because it appears in a free-tools list.
8. **Evidence:** Store provider pricing/terms/docs URLs, date checked, exact plan name, quotas, reviewer decision and test evidence.

## Existing capabilities to reuse first

| Capability | Current project baseline | Evaluation rule |
| --- | --- | --- |
| Application hosting/runtime | Cloudflare Workers | Do not add another runtime without a measured gap and migration plan. |
| Relational data | Cloudflare D1 | Prefer D1-native design and tested backup/restore before adding another database. |
| Static assets | Served with the application | Prefer same-origin assets; evaluate object storage only for a demonstrated media/storage need. |
| Source control and CI | GitHub repository and workflows | Extend existing workflows before adding a second CI provider. |
| Front-end | Vanilla JavaScript with React islands | Avoid runtime CDN dependencies and large client bundles. |
| Dependency governance | `scripts/check-third-party-licenses.mjs` | New npm dependencies must pass lockfile, SPDX allowlist and provenance checks. |
| Connector URL security | `src/connector-url-policy.mjs` | Any external search connector must pass the existing HTTPS/host allowlist policy. |

## Candidate evaluation queue

These are research work items, not approvals. A provider must be independently re-verified before adoption.

| Priority | Area | What to investigate | Preferred outcome | Current decision |
| --- | --- | --- | --- | --- |
| P0 | Monitoring / uptime | Free checks for Worker availability and critical public routes | Detect downtime without exposing private data | Research required |
| P0 | Error reporting | Browser and Worker error capture with PII/content scrubbing | Actionable errors; no chapter-body or credential collection | Research required |
| P0 | Security scanning | Dependency, secret, code and web-application scanning | Add checks to existing GitHub CI where possible | Research required |
| P0 | Backup / recovery | D1 export, restore drills and off-site backup options | Tested recovery with no new database dependency | Design first |
| P1 | Email delivery | Verification and transactional email providers | Reliable transactional delivery with explicit free quota and domain requirements | Research required |
| P1 | Object storage | Media storage compatible with Cloudflare and same-origin delivery | Only if current asset storage is insufficient | Defer pending need |
| P1 | Search | Open-source or free-tier full-text search options | Keep D1/native search unless measured scale requires a separate engine | Benchmark first |
| P1 | Accessibility / quality | Automated accessibility, browser and performance tests | Integrate into current CI with actionable reports | Research required |
| P2 | Analytics | Privacy-respecting, cookieless or self-hostable analytics | Aggregate product metrics without invasive session replay | Research required |
| P2 | Translation management | Translation string workflow and open formats | Preserve 14-language roadmap and independent RTL support | Research required |
| P2 | Feature flags | Free self-hosted or small free-tier rollout controls | Avoid a runtime dependency for simple flags | Research required |

## Integration decision template

For each candidate, record:

- Provider and exact product:
- Official pricing / free-tier URL:
- Official terms / privacy / security URLs:
- Exact plan and date checked:
- Quotas, rate limits and overage behavior:
- Credit-card requirement:
- Commercial-use permission:
- Personal data and content processed:
- Data location, retention and deletion:
- Worker/D1/API compatibility:
- Code licence and dependency impact (if applicable):
- Exit/export plan and fallback:
- Proof-of-concept and automated test results:
- Decision: **Reject / Defer / Prototype / Approve**:
- Approver and review date:

## Implementation rules

- Research and document before changing production architecture.
- Prototype behind a feature flag or in a non-production environment where possible.
- Keep credentials in Cloudflare secrets or the appropriate provider secret store; never commit them.
- Do not add a service to production solely to collect analytics or replay user sessions.
- Do not transmit copyrighted chapter bodies or private user content to external AI, translation, analytics or scraping providers without explicit rights, user-facing disclosure where required, and a separately approved privacy/security review.
- No external service may become a single point of failure for reading, authoring, login, or core catalogue access.
- Update this register with evidence and test results; do not mark a candidate approved based on directory presence alone.

## Current outcome

The repository already has a lean Cloudflare-first architecture and dependency/license guardrails. The first implementation task is therefore **capability gap assessment and monitoring/security research**, not bulk installation. No external provider, dependency, credential, database, or production configuration was changed as part of this register.
