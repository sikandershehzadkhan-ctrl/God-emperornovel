# Account data export and retention inventory

## User-facing export

Signed-in users can download a JSON copy from **Privacy → Download my account data** or directly from `GET /api/privacy/export`.

The route:
- Requires a valid authenticated session.
- derives the account ID only from the server-validated session; it does not accept a user ID from the URL or request body.
- queries each collection with the authenticated account ID, including creator-owned novels and chapters through `novels.owner_user_id`.
- sends a JSON attachment with `Cache-Control: private, no-store`, `Vary: Cookie`, and `X-Content-Type-Options: nosniff`.
- caps each collection at 5,000 rows and lists any collection that exceeded the cap in `export_limits.truncated_collections`.
- excludes password hashes, session tokens, authentication rate-limit keys, internal audit logs, rights-review audit records, and private reviewer identity fields.

The export includes the account profile and its own reading progress, bookmarks, follows, ratings, unlock history, ticket ledger, donation references, novel requests, notifications, comments, reports, reactions, request votes, connector import jobs, account closure request history, archived legacy moderation reports, creator-submitted content-rights records, author applications, AI author projects, AI chapter jobs, AI generation summaries, and creator-owned novels and chapters.

Because export data can include private writing, reading activity, payment references, and personal details, users should keep the downloaded file private and delete unnecessary copies securely.

## Retention inventory

Retention must be based on purpose and legal obligations, not arbitrary deletion timers.

| Data category | Current implementation observation |
| --- | --- |
| Login sessions | Expired sessions are removed when accessed; login cleans expired sessions for that account; logout-all revokes all of the account's sessions. |
| Authentication rate limits | Stale rate-limit rows older than 24 hours are cleaned during rate-limit checks. |
| Financial ledgers and donation records | No automatic expiry is configured. Preserve records needed for balance reconciliation, disputes, and fraud investigation. |
| Administrator and rights audit logs | No automatic expiry is configured. These are intentionally excluded from user exports because they contain internal operational/security records. |
| Reading activity and user-generated content | No general automatic expiry is configured. These records remain account-scoped and are included in the export where supported. |
| Connector import jobs and AI authoring records | No general automatic expiry is configured. User-owned records are included in the export where supported. |\n| Creator rights evidence and archived moderation reports | No general automatic expiry is configured. Creator-submitted rights records and a user's own archived reports are included in the export; internal reviewer and rights-audit records remain excluded. |\n| Aggregate view analytics and provider benchmarks | These are not account-level personal history exports. Daily view tables store aggregate counts without reader identity; chapter view totals and provider benchmarks are operational aggregates. |

## Important limitations

- This export is not a complete account deletion mechanism.
- Account deletion and erasure workflows are not yet implemented. Deleting a user row without reviewing foreign-key, legacy-table, payment, audit, and rights-retention requirements could damage financial reconciliation or leave orphaned records.
- Collections above 5,000 rows are marked as truncated. A paginated export should be implemented before claiming complete export coverage for very large accounts.
- Production export and recovery have not been exercised against real user records. Runtime tests use disposable local D1 only.
- The platform must publish clear retention periods and implement approved expiry/deletion jobs before describing retention as fully automated.

## Release safeguards

1. Keep account exports behind authentication and derive ownership from the session.
2. Never put export files in public object storage or application logs.
3. Never export password hashes, session token hashes, API keys, provider secrets, or internal security records.
4. Test two-account isolation whenever export queries or schema ownership changes.
5. Do not run account deletion, bulk retention, or production export operations without a reviewed migration, backup, and recovery plan.

## Reversible account closure request

The authenticated account closure request API is available at `POST /api/account/closure-request`. It requires the current password, applies a per-account request limit, and records a 14-day cancellation period. A user can inspect their own latest request with `GET /api/account/closure-request` and cancel an active request with `POST /api/account/closure-cancel`.

Request and cancellation events are written to the audit log. Duplicate pending requests are idempotent. Cancelling preserves the account and active session.

**This is a request and grace-period workflow only. It does not delete the account or erase personal data.** Completion requires a separately reviewed process for creator content, financial reconciliation, legal retention, ownership transfer, and dependent records. There is no automated account erasure job.
