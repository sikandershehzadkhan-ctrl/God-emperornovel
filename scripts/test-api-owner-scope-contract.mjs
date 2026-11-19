import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const checks = [
  ["history reads are account-scoped", "WHERE h.user_id=?", ".bind(u.id).all()"],
  ["library reads are account-scoped", "WHERE l.user_id=?", ".bind(u.id).all()"],
  ["bookmark reads are account-scoped", "WHERE b.user_id=?", ".bind(u.id).all()"],
  ["follow reads are account-scoped", "WHERE f.user_id=?", ".bind(u.id).all()"],
  ["notifications are account-scoped", "WHERE user_id=? ORDER BY created_at DESC", ".bind(u.id).all()"],
  ["request reads are account-scoped", "WHERE user_id=? AND week_key=?", ".bind(u.id,week)"],
  ["AI project lists are account-scoped", "WHERE p.owner_user_id=?", ".bind(u.id).all()"],
  ["author novel lists are account-scoped", "WHERE n.owner_user_id=?", ".bind(u.id).all()"]
];
const guardedRoutes = [
  ['if(p==="/api/history"&&m==="GET")', "need(u)"],
  ['if(p==="/api/library"&&m==="GET")', "need(u)"],
  ['if(p==="/api/bookmarks"&&m==="GET")', "need(u)"],
  ['if(p==="/api/follows"&&m==="GET")', "need(u)"],
  ['if(p==="/api/notifications"&&m==="GET")', "need(u)"],
  ['if(p==="/api/requests"&&m==="GET")', "need(u)"],
  ['if(p==="/api/author/ai/projects"&&m==="GET")', "author(u)"],
  ['if(p==="/api/author/novels"&&m==="GET")', "author(u)"]
];
for (const [route, guard] of guardedRoutes) {
  const start = worker.indexOf(route);
  assert.ok(start >= 0, "private endpoint must exist: " + route);
  assert.ok(worker.slice(start, start + 500).includes(guard), "private endpoint must require its session/role guard: " + route);
}

for (const [label, query, binding] of checks) {
  assert.ok(worker.includes(query), label + ": missing owner predicate");
  assert.ok(worker.includes(binding), label + ": missing authenticated-user binding");
}

assert.ok(worker.includes("Number(row.owner_user_id)!==Number(u.id)"), "AI project detail and update handlers must enforce project ownership");
assert.ok(worker.includes("Number(n.owner_user_id)!==Number(u.id)"), "author novel and chapter handlers must enforce novel ownership");
assert.ok(worker.includes("INSERT INTO novels") && worker.includes("rights,u.id,'draft'"), "author-created novels must bind ownership to the authenticated user");
assert.ok(worker.includes("ai_author_projects(owner_user_id,novel_id") && worker.includes(".bind(u.id,novelId,name,mode"), "AI project creation must bind ownership to the authenticated user");

for (const route of [
  'if(p==="/api/admin/users"&&m==="GET")',
  'if(p==="/api/admin/tickets"&&m==="POST")',
  'if(p==="/api/admin/connectors"&&m==="POST")'
]) {
  const start = worker.indexOf(route);
  assert.ok(start >= 0, "admin route must exist: " + route);
  assert.ok(worker.slice(start, start + 1200).includes("admin(u)"), "admin route must require the admin guard: " + route);
}
console.log("PASS: source-level account ownership predicates and admin route guards.");
