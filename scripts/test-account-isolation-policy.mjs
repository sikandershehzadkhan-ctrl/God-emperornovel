import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const lines = source.split("\n");
const route = (needle) => lines.find(line => line.includes(needle)) || "";
const userScoped = [
  ["if(p===\"/api/omni/jobs\"&&m===\"GET\")", "import history"],
  ["if(p===\"/api/history\"&&m===\"GET\")", "reading history"],
  ["if(p===\"/api/reading-position\"&&m===\"GET\")", "reading position"],
  ["if(p===\"/api/library\"&&m===\"GET\")", "personal library"],
  ["if(p===\"/api/bookmarks\"&&m===\"GET\")", "bookmarks"],
  ["if(p===\"/api/notifications\"&&m===\"GET\")", "notifications"],
  ["if(p===\"/api/tickets/ledger\"&&m===\"GET\")", "ticket ledger"],
  ["if(p===\"/api/profile\"&&m===\"GET\")", "private profile"]
];
for (const [needle, label] of userScoped) {
  const line = route(needle);
  assert.ok(line, label + " route must exist");
  assert.match(line, /need\(u\)/, label + " must require authentication");
  assert.match(line, /\.bind\(u\.id/, label + " must scope its database query to the authenticated principal");
}
for (const [needle, label] of [
  ["if(p===\"/api/history\"&&m===\"POST\")", "history writes"],
  ["if(p===\"/api/reading-position\"&&m===\"POST\")", "reading-position writes"],
  ["if(p===\"/api/library\"&&m===\"POST\")", "library writes"],
  ["if(p===\"/api/bookmark\"&&m===\"POST\")", "bookmark writes"]
]) {
  const line = route(needle);
  assert.ok(line, label + " route must exist");
  assert.match(line, /need\(u\)/, label + " must require authentication");
  assert.match(line, /\.bind\(u\.id/, label + " must derive account identity from the authenticated session");
  assert.doesNotMatch(line, /b\.user_id|b\.owner_user_id|body\.user_id/, label + " must not trust a client-supplied account ID");
}
const aiDetailStart = source.indexOf('if(aip&&m==="GET")');
const aiDetailEnd = source.indexOf('if(aip&&m==="PATCH")', aiDetailStart);
const aiDetail = aiDetailStart >= 0 && aiDetailEnd > aiDetailStart ? source.slice(aiDetailStart, aiDetailEnd) : "";
assert.ok(aiDetail, "AI project detail route must exist");
assert.match(aiDetail, /owner_user_id/);
assert.match(aiDetail, /Number\(row\.owner_user_id\)!==Number\(u\.id\)/, "AI project detail must enforce owner isolation");
const authorNovelIndex = lines.findIndex(line => line.includes("SELECT id,owner_user_id,title,alt_titles") && line.includes("FROM novels WHERE id=?"));
const authorNovelEdit = authorNovelIndex >= 0 ? lines.slice(authorNovelIndex, authorNovelIndex + 3).join(" ") : "";
assert.ok(authorNovelEdit);
assert.match(authorNovelEdit, /Number\(n\.owner_user_id\)!==Number\(u\.id\)/, "author novel edit must enforce ownership");
const authorChapterEdit = route("SELECT c.id,c.novel_id,c.chapter_number,c.title,c.content,c.is_locked,c.ticket_cost,c.publication_status,c.created_at,c.updated_at,n.owner_user_id FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?");
assert.ok(authorChapterEdit);
assert.match(authorChapterEdit, /Number\(c\.owner_user_id\)!==Number\(u\.id\)/, "author chapter edit must enforce ownership");
const adminUsers = route("if(p===\"/api/admin/users\"&&m===\"GET\")");
assert.match(adminUsers, /isPlatformOwner\(u,env\)/, "sensitive account directory must be restricted to the configured platform owner");
assert.doesNotMatch(adminUsers, /SELECT \*/);
console.log("PASS: account-scoped reads/writes derive user IDs from sessions; author resources enforce ownership; sensitive user directory is owner-only.");
