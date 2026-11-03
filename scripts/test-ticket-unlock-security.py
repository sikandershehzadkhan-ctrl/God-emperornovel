from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")
single_start = source.index('if(/^\\/api\\/chapters\\/\\d+\\/unlock$/.test(p)&&m==="POST"){')
single_end = source.index('let bu=p.match(/^\\/api\\/novels\\/(\\d+)\\/batch-unlock$/)', single_start)
single = source[single_start:single_end]
batch_start = single_end
batch_end = source.index('if(p==="/api/bookmark"&&m==="POST")', batch_start)
batch = source[batch_start:batch_end]
checks = {
    "single unlock requires authentication before charging": "const e=need(u);if(e)return e;" in single,
    "single unlock has a per-account rate limit": 'consumeAuthRateLimit(env,"chapter-unlock",String(u.id),20,300)' in single,
    "single unlock charges only if balance is sufficient and no unlock exists": "tickets>=? AND NOT EXISTS (SELECT 1 FROM unlocks" in single,
    "single unlock inserts ownership only after a successful debit": "SELECT ?,?,? WHERE changes()=1" in single,
    "single unlock records the matching negative ledger entry": '"chapter_unlock"' in single and "INSERT INTO ticket_ledger" in single,
    "batch unlock restricts pack sizes": "[10,25,50,100].includes(count)" in batch,
    "batch unlock has a stricter per-account rate limit": 'consumeAuthRateLimit(env,"batch-unlock",String(u.id),8,300)' in batch,
    "batch unlock derives price from server-side published chapters": "SELECT c.* FROM chapters c LEFT JOIN unlocks" in batch and "c.ticket_cost" in batch,
    "batch unlock prevents duplicate concurrent unlocks": "AND NOT EXISTS (SELECT 1 FROM unlocks" in batch,
    "batch unlock debits and records each unlock only after successful debit": batch.count("WHERE changes()=1") >= 2,
    "batch unlock records a matching ledger and batch receipt": '"batch_unlock"' in batch and "INSERT INTO unlock_batches" in batch,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
