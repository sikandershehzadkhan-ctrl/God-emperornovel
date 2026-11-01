# Imperial Novel privacy data inventory

This is a schema-level inventory of tables created by the numbered SQL migrations. It is a maintenance map, not a claim that all records have a fixed expiry or that production retention automation is complete.

| Table | Data class | Account export treatment | Retention / handling |
| --- | --- | --- | --- |
| users | Account profile and credential verifier | Limited profile fields only | Account lifecycle controlled; password hash never exported |
| sessions | Authentication secrets | Excluded | Expired sessions cleaned on access/login; logout and logout-all revoke |
| novels | Published and draft creator content | Own novels included | Retain while published/owned; closure needs ownership review |
| chapters | Creator writing and chapter content | Own chapters included through novel ownership | Retain with novel ownership; closure needs content decision |
| genres | Public taxonomy | Excluded | Platform taxonomy |
| tags | Public taxonomy | Excluded | Platform taxonomy |
| novel_genres | Public taxonomy relation | Excluded | Platform taxonomy |
| novel_tags | Public taxonomy relation | Excluded | Platform taxonomy |
| unlocks | User purchase/access history | Own rows included | Financial/access evidence; no automatic expiry |
| unlock_batches | User bulk-unlock history | Own rows included | Financial/access evidence; no automatic expiry |
| bookmarks | Reader preference | Own rows included | No automatic expiry |
| history | Reading activity | Own rows included | No automatic expiry |
| donations | Payment references and status | Own rows included, limited fields | Financial reconciliation; no automatic expiry |
| connectors | Provider configuration | Excluded | Platform configuration; secrets must never enter user export |
| comments | User-generated community content | Own rows included | Moderation and community policy; no automatic expiry |
| novel_requests | User-submitted requests | Own rows included | Retain for request and financial lifecycle |
| audit_logs | Security and administrator audit events | Excluded | Restricted operational evidence; no automatic expiry |
| connector_events | Provider operation events | Excluded | Operational diagnostics; no automatic expiry |
| import_jobs | User connector import history | Own rows included | No automatic expiry |
| recommendations | Personal recommendation history | Own rows included | No automatic expiry |
| ticket_ledger | Crown financial ledger | Own rows included | Financial reconciliation; no automatic expiry |
| follows | Reader follow preferences | Own rows included | No automatic expiry |
| ratings | Reader ratings | Own rows included | No automatic expiry |
| reports | User-submitted content reports | Own rows included | Moderation records; no automatic expiry |
| notifications | User notifications | Own rows included | No automatic expiry |
| app_settings | Platform settings | Excluded | Platform configuration |
| chapter_views | Per-chapter aggregate counters | Excluded | Aggregate analytics; no reader identity |
| content_rights | Content licensing and rights evidence | Creator-submitted records included, excluding reviewer identity | Rights and licensing evidence; no automatic expiry |
| rights_audit_log | Internal rights-review audit | Excluded | Restricted rights/security evidence; no automatic expiry |
| ai_author_projects | Creator AI project data | Own projects included | No automatic expiry |
| ai_chapter_jobs | Creator AI prompts and generated work | Own jobs included | No automatic expiry |
| ai_generation_runs | Creator AI generation summaries | Own runs included | No automatic expiry |
| ai_provider_benchmarks | Provider performance aggregates | Excluded | Operational aggregate; no reader account scope |
| ai_publish_policies | Creator AI publishing preferences | Own project policies included | No automatic expiry |
| request_votes | User votes on novel requests | Own votes included | No automatic expiry |
| author_applications | Author application and portfolio data | Own application included | Review and author lifecycle; no automatic expiry |
| auth_rate_limits | Hashed authentication rate-limit keys | Excluded | Rows older than 24 hours cleaned during rate-limit checks |
| comment_likes | User community interactions | Own likes included | No automatic expiry |
| comment_reports | User moderation reports | Own reports included | Moderation evidence; no automatic expiry |
| comment_reports_legacy_duplicates | Archived legacy moderation reports | Own archived reports included | Preserved for moderation history; no automatic expiry |
| novel_reactions | User reactions | Own reactions included | No automatic expiry |
| novel_view_daily | Daily aggregate novel view requests | Excluded | Aggregate analytics, no reader identity |
| chapter_view_daily | Daily aggregate chapter view requests | Excluded | Aggregate analytics, no reader identity |
| reading_positions | Reader progress | Own progress included | No automatic expiry |
| ratings_ten_point | Ten-point rating migration compatibility table | Not separately exported; canonical ratings export used | Legacy/compatibility schema; review before cleanup |
| account_closure_requests | Account closure request history | Own requests included | Keep closure evidence; no automatic expiry |

## Export boundaries

- Every account-owned export query derives its account identifier from the authenticated session.
- Creator chapters are selected through the creator's owned novel records.
- Creator rights evidence is selected by content_rights.created_by; internal reviewed_by identity and rights_audit_log are not exported.
- Archived legacy reports are filtered by their submitting user_id.
- Credentials, session tokens, authentication hashes, provider configuration, administrator audit records, and internal reviewer identities are excluded.
- Aggregate analytics and platform taxonomy/configuration are not personal account history.
- The JSON export is capped at 5,000 rows per collection and discloses truncation. Large-account pagination remains future work.

## Retention commitments and limitations

No general automatic deletion schedule is currently implemented for financial, creator, reading, community, rights, or audit records. Do not infer an expiry period from a UI label or this inventory. Before enabling automated retention, define jurisdiction-specific periods, legal holds, financial dispute windows, content ownership handling, and a recoverable deletion procedure. Never test destructive retention against production data.

Review this inventory whenever a migration adds, renames, or changes a table containing account, creator, financial, moderation, rights, or operational data.
