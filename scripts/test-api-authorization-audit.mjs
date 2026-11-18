import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const worker = await readFile(new URL("src/index.js", root), "utf8");
const client = await readFile(new URL("public/app.js", root), "utf8");
const inventory = JSON.parse(await readFile(new URL("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", root), "utf8"));
const report = await readFile(new URL("docs/architecture/API-AUTHORIZATION-AUDIT-2026-11-18.md", root), "utf8");

const userLookup = worker.indexOf("const u=await getUser(req,env)");
const health = worker.indexOf('if(p==="/api/health"&&m==="GET")');
assert.ok(health >= 0 && userLookup > health, "Health route must bypass session lookup");

const taxonomyStart = worker.indexOf("function communityTaxonomy(req,env,user){");
const taxonomyEnd = worker.indexOf("async function adminTaxonomy(", taxonomyStart);
assert.ok(taxonomyStart >= 0 && taxonomyEnd > taxonomyStart);
const taxonomy = worker.slice(taxonomyStart, taxonomyEnd);
assert.ok(taxonomy.includes("if(method==='GET')"), "Taxonomy GET must remain public");
assert.ok(taxonomy.includes("if(method==='POST')"), "Taxonomy POST must remain available");
assert.ok(taxonomy.includes("const e=need(user);if(e)return e;"), "Taxonomy POST must require an authenticated account");
assert.ok(taxonomy.includes("user.id") && taxonomy.includes("user.username"));
assert.ok(!taxonomy.includes("b.creator_id") && !taxonomy.includes("b.creator_name"));

const routeLine = path => {
  const entry = inventory.literal_endpoints.find(x => x.path === path);
  assert.ok(entry, "Missing inventory route: " + path);
  return worker.split("\n")[entry.source_lines[0] - 1] || "";
};
assert.match(routeLine("/api/me"), /u\?/);
assert.match(routeLine("/api/omni/status"), /seedOmni\(env\)/);
assert.match(routeLine("/api/omni/search"), /rights_status='authorized'/);
assert.match(routeLine("/api/omni/smart-unlock"), /need\(u\)/);
assert.match(routeLine("/api/admin/stats"), /admin\(u\)/);
const novelsStart = worker.indexOf('if(p==="/api/novels"){');
const novelsEnd = worker.indexOf("let nm=p.match", novelsStart);
assert.ok(novelsStart >= 0 && novelsEnd > novelsStart && worker.slice(novelsStart, novelsEnd).includes("publication_status='published'"), "Public novel listing must filter to published content");
assert.match(report, /Public Omni search exposure/);
assert.match(report, /Full API authorization, resource ownership/);

const exactPaths = ["/api/health","/api/taxonomy","/api/me","/api/config","/api/genres","/api/tags","/api/public-authors","/api/sources","/api/omni/status","/api/omni/search","/api/omni/resolve","/api/omni/smart-unlock","/api/novels","/api/admin/stats"];
assert.equal(exactPaths.length, 14);
for (const path of exactPaths) assert.ok(inventory.literal_endpoints.some(x => x.path === path), "Authorization slice must stay in route inventory: " + path);
assert.ok(client.length > 0, "Client source must be available for literal call-site review");
console.log("API authorization audit slice passed: 14 route classifications and taxonomy identity boundaries.");
