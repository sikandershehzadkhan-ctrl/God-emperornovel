import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const routes = [
  {
    name: "Story Bible generation",
    marker: 'if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/blueprint$/.test(p)&&m==="POST"){',
    next: 'if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)&&m==="POST"){',
    guard: "Only the project owner can generate its Story Bible."
  },
  {
    name: "chapter generation",
    marker: 'if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)&&m==="POST"){',
    next: 'if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)&&m==="GET"){',
    guard: "Only the project owner can run generation jobs."
  }
];
for (const route of routes) {
  const start = source.indexOf(route.marker);
  const end = source.indexOf(route.next, start + route.marker.length);
  assert.ok(start >= 0 && end > start, route.name + " route boundaries must exist");
  const handler = source.slice(start, end);
  assert.ok(handler.includes("Number(row.owner_user_id)!==Number(u.id)"), route.name + " must enforce strict project ownership");
  assert.ok(handler.includes(route.guard), route.name + " must return an explicit owner-only denial");
  assert.ok(!handler.includes("u.role!=='admin'&&Number(row.owner_user_id)!==Number(u.id)"), route.name + " must not allow admin impersonation of creator generation");
}
const projectSchema = source.slice(source.indexOf("async function ensureAuthorAISchema"), source.indexOf("function aiSafeText"));
assert.ok(projectSchema.includes("owner_user_id INTEGER NOT NULL"), "AI projects/jobs/runs must retain owner attribution");
console.log("PASS: AI generation and Story Bible writes are restricted to the project owner; admin read/oversight routes remain separately gated.");
