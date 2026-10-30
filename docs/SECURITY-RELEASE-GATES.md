# Imperial Novel security release gates

This document distinguishes source-code controls from account settings and live operational evidence. A feature is not considered production-secure merely because its code exists.

## 1. Crown balances and chapter access

The canonical balance is stored server-side in D1 (users.tickets). The browser may display a balance but must never be trusted to set it.

Required invariants:

- Only authenticated server routes may change a user's Crown balance.
- A chapter unlock must debit the current D1 balance and grant the unlock in the same conditional D1 batch.
- The grant and ledger entry must be gated on a successful debit.
- A duplicate or concurrent purchase must not debit twice.
- Batch unlocks must fail closed if the balance is insufficient or another request has already changed the selected unlock set.
- Payment credits must derive from the pending server-side donation record, not a client-supplied Crown count.
- A payment callback must be signed, process a pending transaction once, and derive the credit from the server-side amount.
- Refunds must transition a pending request once and credit the refund only when that transition succeeds.
- Manual administrator credits must require the administrator role and a positive bounded amount.

The user-facing /tickets page is the personal Crown wallet. A normal account must be able to see its own balance and payment history. It is not the administrator Crown Vault. The privileged administrator area is /admin/crown-vault, protected by the same server-side administrator policy as /admin.

## 2. Role enforcement

- /admin, /admin.html, and /admin/crown-vault require a current authenticated account whose database role is admin.
- /author, /author.html, and /author/studio require a current authenticated account whose database role is author or admin.
- Public creator profiles such as /author/{username} remain public.
- The Worker must intercept direct HTML asset paths as well as friendly routes. A hidden navigation link is not authorization.
- Every privileged API route must independently check the current database-backed role. Author content mutations must also check ownership.

## 3. Secrets and account protection

- Never commit API keys, passwords, webhook secrets, session tokens, private keys, or database exports to the repository.
- Runtime secrets such as OPENAI_API_KEY and PAYMENT_WEBHOOK_SECRET belong in Cloudflare Worker secrets. The empty PAYMENT_WEBHOOK_SECRET placeholder was removed from wrangler.toml so it can be configured as a Worker secret.
- The current GitHub deployment workflow references CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID from GitHub Actions secrets. These values are not in source files, but this is a separate secret store and does not satisfy a literal policy that all credentials exist only in Cloudflare. A Cloudflare-managed build/deploy credential path must be reviewed before claiming that stricter requirement is met.
- The repository connector cannot inspect GitHub or Cloudflare account security settings. Two-factor authentication is recorded as user-reported enabled, not independently verified by this code audit.

## 4. Database backups and restore

**Production release blocker:** this repository currently contains a read-only D1 audit workflow and a source-code recovery workflow, but no verified database backup artifact and no tested D1 restore procedure. Source recovery is not database recovery.

Before a security release can be deployed:

1. Confirm the Cloudflare D1 backup / Time Travel retention available on the account.
2. Create a fresh backup or point-in-time recovery point before any production data or schema change.
3. Keep any SQL export encrypted and outside GitHub, never as a repository file or ordinary workflow artifact.
4. Restore into a separate temporary D1 database, not over production.
5. Verify schema, account counts, Crown balances, unlock rows, donation states, and ledger consistency using aggregate or synthetic checks.
6. Record the restore timestamp, source backup identifier, target database, operator, and validation result.
7. Only after a successful restore rehearsal may a production change be approved.

Do not run a destructive restore against the live database as a test.

## 5. Deployment verification

The deployment workflow must not equate a successful Wrangler deploy with a successful release. Post-deploy checks must verify:

- Live Worker health and expected release version.
- Homepage and referenced frontend assets.
- Unauthenticated direct requests to protected admin and Author Studio paths return HTTP 401.
- Automated role-policy tests reject ordinary users with HTTP 403 and allow only the correct database roles.
- Crown ledger tests cover insufficient balances, duplicate requests, conditional credits, refunds, and batch purchases.

A live 401 smoke test does not prove the authenticated ordinary-user 403 case by itself. That case is covered by deterministic role-policy tests until a safe dedicated test account is configured.

## 6. Release status

This branch contains proposed security changes only. It has not been merged or deployed. Do not report the new protections as live until the PR is reviewed, all checks pass, a database backup/restore path is verified, the deployment is performed, and the live post-deploy checks pass.
