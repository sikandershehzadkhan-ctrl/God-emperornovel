import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const apiStart = source.indexOf("async function api(req,env){");
const apiEnd = source.indexOf("\n}", apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, "API entrypoint must exist");
const api = source.slice(apiStart, apiEnd);
const guard = api.indexOf('if(!["GET","HEAD","OPTIONS"].includes(m))');
const bootstrap = api.indexOf("await ensureCoreSchema(env)");
const session = api.indexOf("const u=await getUser(req,env)");
assert.ok(guard >= 0 && guard < bootstrap && guard < session, "CSRF guard must run before schema/session/route work");
for (const fragment of [
  'req.headers.get("Origin")',
  'new URL(origin).origin===url.origin',
  'if(!originMatches)return json({error:"Cross-origin request rejected."},403)',
  'req.headers.get("Sec-Fetch-Site")==="cross-site"',
  'return json({error:"Cross-site request rejected."},403)'
]) assert.ok(api.includes(fragment), `missing CSRF invariant: ${fragment}`);

const start = source.indexOf("async function communityTaxonomy(req,env,u){");
const end = source.indexOf("\nasync function adminTaxonomy", start);
assert.ok(start >= 0 && end > start, "community taxonomy handler must exist");
const taxonomy = source.slice(start, end);
for (const fragment of [
  'consumeAuthRateLimit(env,"taxonomy-submit-ip",ip,5,3600)',
  'creator_id,creator_name,status)',
  'u?.id||null',
  'String(u?.username||\'\').slice(0,80)',
  "'pending'"
]) assert.ok(taxonomy.includes(fragment), `missing taxonomy attribution/rate-limit invariant: ${fragment}`);
assert.ok(!taxonomy.includes("b.creator_id") && !taxonomy.includes("b.creator_name"), "client must not supply trusted submitter identity");

console.log("PASS: API rejects cross-origin state changes before session/route execution; taxonomy submissions are rate-limited and attributed only from the verified session.");
