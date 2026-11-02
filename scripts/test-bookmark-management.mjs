import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");
const schema = readFileSync(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");

const getAt = source.indexOf('if(p==="/api/bookmarks"&&m==="GET")');
const deleteAt = source.indexOf('if(p==="/api/bookmarks"&&m==="DELETE")', getAt);
const reactionsAt = source.indexOf('if(p==="/api/novel-reactions"&&m==="GET")', deleteAt);
assert.ok(getAt >= 0 && deleteAt > getAt && reactionsAt > deleteAt, "bookmark GET and DELETE routes must remain present and bounded");
const route = source.slice(deleteAt, reactionsAt);
for (const [fragment, description] of [
  ["need(u)", "bookmark deletion must require an authenticated account"],
  ['url.searchParams.get("novel_id")', "bookmark deletion must require a specific novel"],
  ["Number.isSafeInteger(nid)||nid<1", "bookmark deletion must validate the novel identifier"],
  ["DELETE FROM bookmarks WHERE user_id=? AND novel_id=?", "bookmark deletion must be scoped to the current account and one novel"],
  ["return json({ok:true,removed:", "bookmark deletion must return an idempotent result"]
]) assert.ok(route.includes(fragment), description);
assert.ok(!route.includes("DELETE FROM history") && !route.includes("DELETE FROM user_library"), "bookmark deletion must preserve reading history and Library membership");
const bookmarkSchemaAt = schema.indexOf("CREATE TABLE IF NOT EXISTS bookmarks");
const bookmarkSchema = schema.slice(bookmarkSchemaAt, schema.indexOf(");", bookmarkSchemaAt));
assert.ok(/PRIMARY KEY\s*\(user_id,novel_id\)/i.test(bookmarkSchema), "database must prevent duplicate per-account bookmark rows");
assert.ok(app.includes("method:'DELETE'") && app.includes("/api/bookmarks?novel_id="), "Library bookmark list must use the single-novel delete endpoint");
assert.ok(app.includes("removeBookmark"), "Library must expose bookmark removal controls");
assert.ok(app.includes("Your reading history and saved Library entry will remain."), "bookmark UI must explain independent data retention");
assert.ok(runtime === app, "served versioned app runtime must stay synchronized with editable app source");
console.log("PASS: bookmark removal is authenticated, single-entry, account-scoped and independent of reading history and Library membership.");
