import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const apiStart = worker.indexOf("async function api(req,env){");
const apiEnd = worker.indexOf("async function sitemap(", apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, "API dispatcher boundaries must exist");
const api = worker.slice(apiStart, apiEnd);

function routeBlock(marker) {
  const start = api.indexOf(marker);
  assert.ok(start >= 0, "Expected API route not found: " + marker);
  const next = api.indexOf("\n if(", start + marker.length);
  return api.slice(start, next > start ? next : api.length);
}
function requiresSession(marker) {
  const block = routeBlock(marker);
  assert.ok(block.includes("need(u)"), "Personal route must require an authenticated session: " + marker);
  return block;
}
function bindsCurrentUser(block, marker) {
  assert.ok(block.includes(".bind(u.id"), "Personal data query/write must bind the authenticated user ID: " + marker);
}

const personalReads = [
  'if(p==="/api/history"&&m==="GET")',
  'if(p==="/api/library"&&m==="GET")',
  'if(p==="/api/bookmarks"&&m==="GET")',
  'if(p==="/api/notifications"&&m==="GET")',
  'if(p==="/api/tickets/ledger"&&m==="GET")',
  'if(p==="/api/follows"&&m==="GET")',
  'if(p==="/api/omni/jobs"&&m==="GET")',
];
for (const marker of personalReads) bindsCurrentUser(requiresSession(marker), marker);

const personalWrites = [
  'if(p==="/api/history"&&m==="POST")',
  'if(p==="/api/library"&&m==="POST")',
  'if(p==="/api/follow"&&m==="POST")',
  'if(p==="/api/notifications/read"&&m==="POST")',
  'if(p==="/api/novel-reactions"&&m==="POST")',
  'if(p==="/api/comments"&&m==="POST")',
  'if(p==="/api/comments/like"&&m==="POST")',
  'if(p==="/api/rating"&&m==="POST")',
];
for (const marker of personalWrites) bindsCurrentUser(requiresSession(marker), marker);

const profile = requiresSession('if(p==="/api/profile"&&m==="GET")');
assert.ok((profile.match(/\.bind\(u\.id\)/g) || []).length >= 4, "Profile aggregates must scope every personal statistic to the current user");

const appStatus = requiresSession('if(p==="/api/author/applications/me"&&m==="GET")');
assert.ok(appStatus.includes("WHERE user_id=?") && appStatus.includes(".bind(u.id)"), "Author application status must be scoped to its applicant");

const projectList = requiresSession('if(p==="/api/author/ai/projects"&&m==="GET")');
assert.ok(projectList.includes("WHERE p.owner_user_id=?") && projectList.includes(".bind(u.id)"), "Author AI project listing must be scoped to its owner");

assert.ok(api.includes("let aip=p.match"), "Individual author AI project routes must remain registered");
assert.ok(api.includes("Number(row.owner_user_id)!==Number(u.id)"), "Individual author AI projects must enforce owner identity");
assert.ok(api.includes("Number(c.owner_user_id)!==Number(u.id)"), "Author chapter operations must enforce parent novel ownership");
assert.ok(api.includes("Number(n.owner_user_id)!==Number(u.id)"), "Author novel operations must enforce novel ownership");

const session = worker.slice(worker.indexOf("async function getUser("), worker.indexOf("const need=", worker.indexOf("async function getUser(")));
assert.ok(session.includes("WHERE s.token_hash=?"), "Session lookup must use a hashed session token");
assert.ok(session.includes("u.banned"), "Banned accounts must not authenticate");
assert.ok(session.includes("u.expires_at<now()"), "Expired sessions must not authenticate");

console.log("User-data isolation source contracts passed. These checks verify ownership wiring only, not adversarial two-account runtime behavior.");
