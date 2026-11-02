import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const start=source.indexOf('if(p==="/api/admin/account-deletion/reviews"&&m==="GET")');
assert.notEqual(start,-1,"admin review queue route must exist");
const end=source.indexOf('if(p==="/api/auth/logout"&&m==="POST")',start);
assert.notEqual(end,-1,"review queue route must end before logout route");
const route=source.slice(start,end);
assert.match(route,/const authError=admin\(u\);if\(authError\)return authError/,"route must enforce administrator authorization before reading data");
assert.match(route,/consumeAuthRateLimit\(env,"account-deletion-review-queue",String\(u\.id\),30,60\)/,"queue reads must be rate limited per administrator");
assert.match(route,/LIMIT 50/,"queue must have a bounded result set");
assert.match(route,/substr\(r\.review_reason,1,240\)/,"review reason must be truncated");
assert.match(route,/read_only:true,finalization_enabled:false/,"response must explicitly remain read-only");
assert.match(route,/catch\(error\)/,"missing migration must fail closed");
assert.doesNotMatch(route,/SELECT[^;]*(email|password_hash|content|rights_evidence)/i,"queue must not fetch unnecessary sensitive account or content fields");
assert.match(route,/account_deletion_review_queue_viewed/,"queue access must be audited");
console.log("PASS: account deletion admin queue is admin-only, rate-limited, bounded, minimized, audited, and read-only.");
