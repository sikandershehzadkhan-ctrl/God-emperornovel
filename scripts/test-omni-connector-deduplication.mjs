import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(source, /INSERT INTO connectors\(name,base_url,type,enabled,rights_status,last_status\) SELECT \?,\?,\s*'registry',0,'pending','registry' WHERE NOT EXISTS \(SELECT 1 FROM connectors WHERE lower\(trim\(base_url\)\)=lower\(trim\(\?\)\)\)/, "connector registry seeding must be idempotent even without a database uniqueness constraint");
assert.match(source, /SELECT c\.id,c\.name,c\.base_url,c\.type,c\.enabled,c\.rights_status,c\.last_status,c\.last_checked_at FROM connectors c WHERE c\.id=\(SELECT c2\.id FROM connectors c2 WHERE lower\(trim\(c2\.base_url\)\)=lower\(trim\(c\.base_url\)\)/, "public OmniPortal status must return one representative per connector URL");
assert.match(source, /ORDER BY CASE WHEN c2\.enabled=1 OR c2\.rights_status='authorized' THEN 0 ELSE 1 END,c2\.id LIMIT 1/, "connector status deduplication must preserve the enabled or authorized record where duplicates exist");
console.log("OmniPortal connector seed idempotency and public status deduplication checks passed.");
