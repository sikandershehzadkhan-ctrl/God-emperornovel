# Imperial Novel source recovery

- Source base: Imperial Novel 16.63.0
- UI patch archive: 16.64.0 three-line menu design update
- Archive manifest hashes checked before restoration.
- Worker and browser JavaScript syntax checks passed.
- All eight SQLite/D1 migration files applied to a fresh in-memory SQLite database.
- Corrected the known five-placeholder/four-value SQL defect in the novel-request refund ledger insert.
- No production D1 migrations were run.
- No production deployment was performed by this workflow.
- Production deployment remains a separate manual workflow requiring explicit confirmation.
