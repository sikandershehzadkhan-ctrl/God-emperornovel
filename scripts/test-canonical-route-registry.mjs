import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SITEMAP_STATIC_PATHS } from "../src/sitemap.mjs";
const registry=JSON.parse(await readFile(new URL("../docs/architecture/CANONICAL-ROUTE-REGISTRY.json",import.meta.url),"utf8"));
const api=JSON.parse(await readFile(new URL("../docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json",import.meta.url),"utf8"));
const worker=await readFile(new URL("../src/index.js",import.meta.url),"utf8");
const client=await readFile(new URL("../public/app.js",import.meta.url),"utf8");
const sitemap=await readFile(new URL("../src/sitemap.mjs",import.meta.url),"utf8");
assert.equal(registry.status,"canonical-source-contract-foundation-review-gated");
assert.equal(registry.pages.length,33);
assert.equal(registry.dynamic_pages.length,6);
assert.equal(registry.api_endpoints.length,api.literal_endpoints.length);
assert.equal(registry.dynamic_api_endpoints.length,api.dynamic_endpoints.length);
assert.deepEqual(registry.api_endpoints.map(x=>x.path).sort(),api.literal_endpoints.map(x=>x.path).sort());
assert.deepEqual(registry.sitemap.static_paths,[...SITEMAP_STATIC_PATHS]);
assert.ok(sitemap.includes("export const SITEMAP_STATIC_PATHS"));
const map=worker.match(/const map=\{([\s\S]*?)\};if\(map\[p\]\)/);
assert.ok(map,"Worker route map must exist");
const actual=new Map([...map[1].matchAll(/"([^"]+)":"([^"]+)"/g)].map(x=>[x[1],x[2]]));
for(const route of registry.pages) assert.equal(actual.get(route.path),route.shell,"Canonical route shell mismatch: "+route.path);
for(const route of registry.dynamic_pages) {
 assert.ok(worker.includes(route.source_expression),"Dynamic page source expression missing: "+route.kind);
 for(const sample of route.samples||[]) assert.ok(new RegExp(route.pattern).test(sample),"Invalid dynamic route sample: "+sample);
}
const apiStart=worker.indexOf("async function api("),apiEnd=worker.indexOf("async function sitemap(",apiStart);
assert.ok(apiStart>=0&&apiEnd>apiStart);
const apiSource=worker.slice(apiStart,apiEnd);
for(const route of registry.api_endpoints) {
 assert.ok(apiSource.includes(JSON.stringify(route.path))||apiSource.includes("'"+route.path+"'"),"API route missing: "+route.path);
 assert.ok(route.methods.length>0,"API method contract missing: "+route.path);
 assert.equal(route.authz,"not-certified","Do not silently certify authz: "+route.path);
}
for(const route of registry.dynamic_api_endpoints) {
 assert.ok(apiSource.includes(route.source_expression),"Dynamic API source expression missing: "+route.pattern);
 assert.ok(route.methods.length>0,"Dynamic API methods missing: "+route.pattern);
}
assert.equal(registry.sitemap.static_paths.length,SITEMAP_STATIC_PATHS.length);
assert.equal(registry.navigation.normalized_destinations,41);
assert.equal(registry.governance.unowned_files,0);
assert.equal(registry.governance.multiply_owned_files,0);
assert.ok(registry.known_blockers.length>=5,"Outstanding release blockers must remain visible");
console.log("Canonical route registry contract passed: "+registry.pages.length+" pages, "+registry.dynamic_pages.length+" dynamic page families, "+registry.api_endpoints.length+" literal API endpoints, "+registry.dynamic_api_endpoints.length+" dynamic API families.");
