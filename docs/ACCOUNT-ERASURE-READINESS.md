# Account erasure readiness and deletion safeguards

## Current status

**Automated account erasure is not implemented.** The account closure endpoints only record a reversible request and allow cancellation during a 14-day grace period. No request, timer, admin action, or scheduled job may currently delete a user or their data.

This is intentional. A user row is connected to creator publishing, purchases, payment reconciliation, licensing evidence, moderation, audit history, connector activity, and AI authoring. A blind `DELETE FROM users` would be unsafe even where foreign keys cascade.

## Required decision gates before any erasure implementation

An account may not enter a destructive workflow until every gate has a documented result:

1. **Identity and authorization:** authenticate the account holder, verify a recent credential or approved recovery factor, prevent support/admin impersonation, and record the verified request.
2. **Grace period:** preserve the existing 14-day cancellation period. Notify the account holder at request, before expiry, and on cancellation/completion where contact is available.
3. **Financial reconciliation:** calculate and resolve pending donations, Crown balances, ticket-ledger entries, unlock purchases, refunds, disputes, chargebacks, and payment-provider references. Never silently delete or rewrite ledger history.
4. **Creator ownership:** list every novel, chapter, draft, AI project, generated chapter, application, and rights record. Require an explicit transfer, continued publication under a disclosed pseudonymous/deactivated author identity, or a reviewed unpublish/archive decision. Never transfer ownership implicitly.
5. **Rights and licensing:** preserve the minimum rights evidence and reviewer decision trail required to establish authorization, attribution, takedown history, or a legal hold. Remove private evidence only after an authorized retention decision.
6. **Community safety:** preserve or redact reports, moderation decisions, and evidence according to a documented policy. Remove public profile identifiers where appropriate without destroying active abuse investigations.
7. **Audit and legal hold:** determine which security, administrator, payment, rights, and moderation records must be retained, who can access them, and for how long. Do not delete audit evidence as a side effect of deleting an account.
8. **Dependent records:** review all foreign keys, tables without foreign keys, JSON references, object storage, caches, analytics, connector providers, and external backups. A migration-only table list is not sufficient proof of complete dependency coverage.
9. **Recovery:** verify an isolated restore from a recent encrypted backup, test rollback/reconciliation, and document the operator and approval trail. Never test deletion against production.
10. **Completion proof:** generate a restricted deletion manifest showing each data class, action (delete, anonymize, retain, transfer), reason, legal basis/retention period, result, and exceptions. Do not include secrets in the manifest.

## Data-class disposition register

The table below maps the current migration inventory to the decision required. "Review" means no automatic deletion is approved yet.

| Table | Required closure/erasure decision |
| --- | --- |
| users | Deactivate or pseudonymize only after all ownership, financial, identity, and retention gates pass; no direct delete is approved |
| sessions | Revoke all sessions immediately on an approved closure lock; tokens are never retained in an export |
| novels | Transfer with explicit consent, retain under disclosed pseudonym, or unpublish/archive after rights review |
| chapters | Follow the parent novel decision; preserve licensed/publication evidence |
| genres | Platform taxonomy; never delete for one account |
| tags | Platform taxonomy; never delete for one account |
| novel_genres | Reconcile with novel disposition; shared taxonomy rows remain |
| novel_tags | Reconcile with novel disposition; shared taxonomy rows remain |
| unlocks | Preserve purchase/access evidence; do not cascade away ledger-linked history |
| unlock_batches | Preserve financial/access evidence and reconciliation links |
| bookmarks | Delete or anonymize as reader preference after request verification |
| history | Delete or anonymize as reading activity after request verification |
| donations | Retain minimum payment/dispute evidence under approved financial retention rules; redact unnecessary identity separately |
| connectors | Platform configuration; never delete shared providers for one account |
| comments | Remove, anonymize, or retain under moderation/legal-hold policy; preserve investigation evidence where required |
| novel_requests | Resolve paid request/refund lifecycle first; then delete or pseudonymize request text where lawful |
| audit_logs | Restricted retention; do not cascade or erase as part of user deletion |
| connector_events | Remove account-identifying diagnostic payloads only after incident/operational retention review |
| import_jobs | Delete or anonymize account-owned import history after provider and rights review |
| recommendations | Delete or anonymize account-specific recommendation history |
| ticket_ledger | Immutable financial evidence; preserve and restrict access under approved accounting policy |
| follows | Delete account preference rows |
| ratings | Delete or anonymize account ratings while preserving only approved aggregate statistics |
| reports | Retain or redact according to moderation, safety, and legal-hold policy |
| notifications | Delete account notifications after required closure notices and evidence are preserved |
| app_settings | Platform settings; never delete shared settings for one account |
| chapter_views | Aggregate counters; verify no user identity is stored before retention or aggregation changes |
| content_rights | Preserve creator rights evidence or transfer responsibility explicitly; remove private evidence only after rights/legal review |
| rights_audit_log | Restricted rights-review evidence; retain according to approved policy and legal holds |
| ai_author_projects | Transfer, export, or delete creator projects after ownership and user choice; remove provider secrets if any were improperly stored |
| ai_chapter_jobs | Follow project disposition; prompts and generated content may contain private writing |
| ai_generation_runs | Follow project disposition; inspect input/output summaries for personal or confidential data |
| ai_provider_benchmarks | Platform/provider aggregates; ensure no account-level payloads are embedded |
| ai_publish_policies | Delete with the project or transfer with explicit project ownership |
| request_votes | Delete account vote rows or retain only non-identifying aggregate counts |
| author_applications | Delete or redact portfolio/contact data after review obligations and any active application decision |
| auth_rate_limits | Expire hashed keys under the existing bounded cleanup policy |
| comment_likes | Delete account interaction rows |
| comment_reports | Retain/redact moderation evidence under safety and legal-hold policy |
| comment_reports_legacy_duplicates | Preserve only as long as required for moderation/audit purposes; redact reporter identifiers when approved |
| novel_reactions | Delete account reaction rows or retain only approved aggregates |
| novel_view_daily | Aggregate analytics; verify no account identity is present |
| chapter_view_daily | Aggregate analytics; verify no account identity is present |
| reading_positions | Delete account reading progress |
| ratings_ten_point | Reconcile with canonical ratings before deleting compatibility data; never double-count or orphan rating state |
| account_closure_requests | Preserve request/cancellation/completion evidence under a defined retention policy; do not delete before completion manifest |

## Implementation sequence

1. Keep the current request/cancel workflow non-destructive.
2. Complete an exhaustive schema and code-reference scan, including runtime-created tables, object storage, cache keys, and external services.
3. Define jurisdiction-specific financial, tax, rights, safety, and privacy retention periods with qualified review.
4. Implement a closure lock that blocks new purchases, publishing, generation, and other mutations without destroying data.
5. Build an account-holder preview showing content, balances, pending obligations, transfer options, and retained data categories.
6. Add an explicit completion confirmation and a separately authorized operator workflow for exceptions/legal holds.
7. Implement idempotent, resumable per-data-class actions with a durable restricted manifest and audit trail.
8. Test on synthetic disposable D1 data, including failures halfway through, retry, restore, ownership transfer, and financial reconciliation.
9. Only after all checks pass, consider a staged production rollout with a verified recovery point and explicit release approval.

## Non-goals and safety rules

- No destructive account-deletion endpoint is authorized by this document.
- No production user data has been exported, deleted, or migrated by these checks.
- No fixed retention period is invented here. Legal/accounting owners must approve the period for each retained class.
- "Anonymize" must be tested for indirect identifiers and linked content; replacing a username alone is not sufficient.
- Deleting a database row does not remove copies in backups, logs, caches, analytics, object storage, or external providers.
- Do not claim complete erasure until every listed system and retained exception has a verified disposition.
