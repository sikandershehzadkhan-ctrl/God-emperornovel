import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const start = worker.indexOf("async function api(req,env){");
const end = worker.indexOf("async function sitemap(", start);
assert.ok(start >= 0 && end > start, "Worker API dispatcher must exist");
const api = worker.slice(start, end);

const table = api.match(/const methodContracts=\{([\s\S]*?)\n \};/);
assert.ok(table, "Centralized method contract table must exist");
const expected = {
  "/api/health": ["GET"],
  "/api/taxonomy": ["GET", "POST"],
  "/api/me": ["GET"],
  "/api/config": ["GET"],
  "/api/genres": ["GET"],
  "/api/tags": ["GET"],
  "/api/public-authors": ["GET"],
  "/api/sources": ["GET"],
  "/api/omni/status": ["GET"],
  "/api/omni/search": ["GET"],
  "/api/omni/resolve": ["GET"],
  "/api/omni/smart-unlock": ["GET"],
  "/api/novels": ["GET"],
  "/api/admin/stats": ["GET"]
};
const actual = {};
for (const match of table[1].matchAll(/["']([^"']+)["']\s*:\s*\[([^\]]*)\]/g)) {
  actual[match[1]] = [...match[2].matchAll(/["'](GET|POST|PATCH|PUT|DELETE)["']/g)].map(x => x[1]);
}
assert.deepEqual(actual, expected, "Centralized method contracts must match the reviewed allowlist");

const gate = api.indexOf("if(allowedMethods&&!allowedMethods.includes(m))");
const schema = api.indexOf("await ensureCoreSchema(env)");
const session = api.indexOf("await getUser(req,env)");
const health = api.indexOf('if(p==="/api/health"&&m==="GET")');
assert.ok(gate >= 0 && gate < schema && gate < session && gate < health, "Unsupported methods must be rejected before schema setup, session lookup, and route handling");
assert.match(api.slice(gate, schema), /405/);
assert.match(api.slice(gate, schema), /allow:allowedMethods\.join\(", "\)/);
assert.equal((api.match(/if\(p==="\/api\/health"/g) || []).length, 1, "Health route must have one GET handler, not a permissive fallback");
console.log("API method contract tests passed: 14 centralized routes, 405 + Allow behavior, and rejection before bootstrap.");
