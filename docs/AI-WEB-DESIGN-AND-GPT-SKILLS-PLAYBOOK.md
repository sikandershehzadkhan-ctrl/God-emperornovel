# Imperial Novel: AI Web Design and GPT-Skills Playbook

## References reviewed

- Packt Publishing, *ChatGPT for Web Design – Create Amazing Websites*: https://github.com/PacktPublishing/ChatGPT-for-Web-Design---Create-Amazing-Websites-
- GitHub topic: AI website builders: https://github.com/topics/ai-website-builder
- GitHub topic: GPT skills: https://github.com/topics/gpt-skills

The Packt repository README identifies the book but does not itself expose a complete reusable skill framework in the README. The two GitHub topic pages are discovery indexes, not single tools or installable skill packages. Treat them as research leads, not as dependencies to install blindly.

## How to apply the ideas to Imperial Novel

### 1. Design skill: define before generating

Use the existing Imperial Novel product identity:
- Product name: Imperial Novel
- Brand line: Read • Create • Conquer
- Visual language: premium imperial editorial design; midnight/navy and obsidian foundations, imperial purple, sapphire blue, clean white, restrained turquoise and very restrained gold.
- Avoid: rainbow gradients, excessive glow/particles, casino/crypto styling, generic anime-template layouts, invented usage statistics.
- Mobile-first: test narrow layouts, tap targets, readable type, three-line menu, high contrast and reduced-motion behavior.
- Use actual catalog data and clear empty/loading/error states. Never invent books, authors, views, rankings, revenue or payment status.

### 2. Feature skill: plan, implement, verify

For each feature, require an explicit mini-spec:
1. User problem and intended outcome.
2. Relevant routes, components, data model and permissions.
3. Loading, empty, success, failure and mobile states.
4. Accessibility and security considerations.
5. Acceptance checks and regression tests.
6. Files changed and any migration or environment requirements.

Prefer small, reviewable changes over broad redesigns that cannot be tested. Do not mark a feature complete because a mockup looks finished; verify the real backend and persistence path.

### 3. Rights, safety and payments

- Only original, licensed, authorized, public-domain, or appropriately Creative-Commons content may be published.
- Trend discovery may use permitted metadata, RSS or APIs. Do not ingest chapter bodies without explicit rights.
- Keep OmniPortal connectors disabled until rights and permissions are approved.
- EasyPaisa/ticket payments must remain pending until an authorized admin approves them. Never display success merely because a user submits a receipt.
- Keep secrets out of Git, source files, logs and build artifacts. Use GitHub Actions secrets and least-privilege tokens.

### 4. Automated delivery: gates before deployment

Current repository findings show the legacy workflow on `main` deploys a ZIP named `Imperial-Novel-16.4.0-Chapter-Creation-Repair.zip`. The repository currently has no root-level `package.json` on the automation branch, so the source validation gate correctly stops before installing dependencies or building.

Required delivery sequence:
1. Identify and verify the intended current source tree.
2. Run install, lint/type checks, Cloudflare readiness checks and production build against that exact source.
3. Verify Wrangler configuration and D1 SQLite migrations; do not assume Postgres migrations are compatible with D1.
4. Deploy to a separate staging Worker and separate staging D1 database.
5. Run HTTP smoke tests and basic reader/catalog/auth checks.
6. Require human review before promoting to production.
7. After production promotion, check health and preserve a rollback path.

Do not turn on automatic production deployment until source, credentials, environment bindings and a staging run are verified. The new validation workflow must not deploy. Never bind staging to `god-emperornovel-db`.

### 5. Reusable AI task prompt

Use this prompt when assigning a website task to an AI coding agent:

> Work on the existing Imperial Novel repository, not a separate demo. First inspect the actual repository and identify the source of truth. State findings with exact file paths before editing. Preserve the Imperial Novel branding and mobile-first design requirements. Make the smallest complete implementation that solves the requested problem. Do not fabricate data or credentials, do not ingest unlicensed chapter content, and do not change production databases. Add or update tests and documentation. Run the real project checks available in the repository and report each command and its result. If source files, secrets, permissions, or environment details are missing, stop at that gate and explain the exact blocker rather than claiming success. Do not deploy production without an explicit verified release path.

## Status boundary

This playbook is guidance, not proof that a new website feature has been implemented. The deployment automation remains incomplete until the correct source is present, checks pass, staging is configured and tested, and production promotion is deliberately enabled.
