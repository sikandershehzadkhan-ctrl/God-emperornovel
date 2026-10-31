from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")
start = source.index('if(p==="/api/admin/ticket-reconciliation"&&m==="GET"){')
end = source.index('if(p==="/api/admin/connectors"&&m==="GET"){', start)
route = source[start:end]

checks = {
    "reconciliation endpoint is admin-only": "const e=admin(u);if(e)return e;" in route,
    "reconciliation endpoint is read-only": "read_only:true" in route and not any(
        token in route for token in ("UPDATE ", "INSERT ", "DELETE ", ".batch(")
    ),
    "reconciliation endpoint is rate-limited per administrator": 'consumeAuthRateLimit(env,"admin-ticket-reconciliation",String(u.id),30,300)' in route,
    "summary compares account balances with the complete ledger total": "SUM(tickets)" in route and "SUM(delta) FROM ticket_ledger" in route,
    "per-account comparison groups ledger entries by account": "LEFT JOIN ticket_ledger l ON l.user_id=u.id" in route and "GROUP BY u.id" in route,
    "only meaningful discrepancies are reported": "ABS(u.tickets-COALESCE(SUM(l.delta),0))>0.000001" in route,
    "mismatch output is bounded": "LIMIT 200" in route,
    "response identifies read-only output and includes summary plus mismatches": "summary:summary" in route and "mismatches:mismatches.results" in route,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
