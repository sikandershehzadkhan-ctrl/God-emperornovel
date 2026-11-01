import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/index.js", "utf8");
const routeStart = source.indexOf('if(p==="/api/me/export"&&m==="GET")');
const routeEnd = source.indexOf('if(p==="/api/me")', routeStart);
assert.ok(routeStart >= 0 && routeEnd > routeStart, "authenticated account export route must exist before the ordinary /api/me route");
const route = source.slice(routeStart, routeEnd);

assert.match(route, /const authError=need\(u\);if\(authError\)return authError/, "anonymous exports must be rejected");
assert.match(route, /consumeAuthRateLimit\(env,"account-data-export",String\(u\.id\),3,3600\)/, "exports must be rate limited per authenticated account");
for (const table of ["history","bookmarks","follows","user_library","ratings","unlocks","unlock_batches","ticket_ledger","donations","novel_requests","comments","reports","notifications","import_jobs","connector_authorization_requests"]) {
  const query = route.match(new RegExp('SELECT[^\`]*FROM\\s+' + table + '\\s+WHERE\\s+user_id=\\?', "i"));
  assert.ok(query, table + " export query must be explicitly scoped to the authenticated user ID");
}
assert.match(route, /FROM novels WHERE owner_user_id=\?/, "creator novels must be scoped to their owner");
assert.match(route, /FROM ai_author_projects WHERE owner_user_id=\\?/, "AI projects must be scoped to their owner");
assert.match(route, /FROM ai_chapter_jobs WHERE owner_user_id=\\?/, "AI chapter jobs must be scoped to their owner");
assert.match(route, /FROM ai_generation_runs WHERE owner_user_id=\\?/, "AI generation history must be scoped to its owner");
assert.match(route, /WHERE from_user_id=\\? OR to_user_id=\\?/, "ownership transfer history must include only transfers involving the authenticated user");
assert.match(route, /WHERE n\.owner_user_id=\?/, "creator chapters must be scoped through the owning novel");
assert.doesNotMatch(route, /password_hash|token_hash|sessions\s|reset_tokens|audit_logs|reviewed_by|review_notes/, "sensitive credentials and internal review data must never be exported");
assert.match(route, /cache-control":"no-store, private"/, "exports must not be cached");
assert.match(route, /content-disposition/, "exports must download as a JSON attachment");
assert.match(route, /format:"imperial-novel-account-export-v1"/, "exports must have a versioned format identifier");

console.log("Account data export policy checks passed.");
