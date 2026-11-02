import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");
const schema = readFileSync(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");

const getAt = source.indexOf('if(p==="/api/history"&&m==="GET")');
const deleteAt = source.indexOf('if(p==="/api/history"&&m==="DELETE")', getAt);
const postAt = source.indexOf('if(p==="/api/history"&&m==="POST")', deleteAt);
assert.ok(getAt >= 0 && deleteAt > getAt && postAt > deleteAt, "history GET, DELETE and POST routes must remain ordered and present");
const route = source.slice(deleteAt, postAt);
for (const [fragment, description] of [
  ["need(u)", "history deletion must require an authenticated account"],
  ['url.searchParams.get("novel_id")', "history deletion must require a specific novel"],
  ["Number.isSafeInteger(nid)||nid<1", "history deletion must validate the novel identifier"],
  ["DELETE FROM history WHERE user_id=? AND novel_id=?", "history deletion must be scoped to the current account and one novel"],
  ["return json({ok:true,removed:", "history deletion must return a clear idempotent result"]
]) assert.ok(route.includes(fragment), description);
assert.ok(!route.includes("DELETE FROM bookmarks") && !route.includes("DELETE FROM user_library"), "history deletion must preserve bookmarks and Library membership");
assert.ok(!route.includes('DELETE FROM history WHERE user_id=?").bind(u.id).run()'), "history endpoint must not expose a bulk clear operation");
assert.ok(/PRIMARY KEY\s*\(user_id,novel_id\)/i.test(schema.slice(schema.indexOf("CREATE TABLE IF NOT EXISTS history"), schema.indexOf(");", schema.indexOf("CREATE TABLE IF NOT EXISTS history")))), "history table must prevent duplicate per-account novel rows");
assert.ok(app.includes("method:'DELETE'") && app.includes("/api/history?novel_id="), "history page must use the single-novel delete endpoint");
assert.ok(app.includes("Saved Library entries and bookmarks will remain."), "history UI must explain that independent saved data is retained");
assert.ok(app.includes("removeHistory"), "history page must expose per-entry removal controls");
assert.ok(runtime === app, "served versioned app runtime must stay synchronized with editable app source");
console.log("PASS: reading history removal is authenticated, single-entry, account-scoped and independent of bookmarks and Library membership; duplicate rows remain database-constrained.");
