import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SITEMAP_STATIC_PATHS, PAGE_SHELLS, DYNAMIC_PAGE_ROUTES, NOINDEX_EXACT_PATHS, resolvePageShell } from "../src/route-registry.mjs";
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
assert.ok(sitemap.includes("export { SITEMAP_STATIC_PATHS }"));
assert.ok(worker.includes('import { NOINDEX_EXACT_PATHS, resolvePageShell } from "./route-registry.mjs";'),"Worker must consume the canonical runtime route registry");
assert.ok(worker.includes('else if(resolvePageShell(p)||!p.includes("."))r=await html(req,env);'),"Worker fetch dispatch must route through the canonical page registry");
for(const route of registry.pages) { assert.equal(PAGE_SHELLS[route.path],route.shell,"Canonical route shell mismatch: "+route.path); assert.equal(resolvePageShell(route.path),route.shell,"Runtime route resolution mismatch: "+route.path); }
assert.deepEqual(Object.keys(PAGE_SHELLS).sort(),registry.pages.map(route=>route.path).sort(),"Runtime page routes must match the canonical evidence registry");
assert.deepEqual([...NOINDEX_EXACT_PATHS],registry.sitemap.noindex_exact_paths,"Noindex policy must match the canonical evidence registry");
assert.deepEqual([...SITEMAP_STATIC_PATHS],registry.sitemap.static_paths,"Sitemap membership must match the canonical evidence registry");
for(const route of registry.dynamic_pages) {
 const runtime=DYNAMIC_PAGE_ROUTES.find(item=>item.kind===route.kind);
 assert.ok(runtime,"Dynamic route family missing from runtime registry: "+route.kind);
 assert.equal(runtime.shell,route.shell,"Dynamic route shell mismatch: "+route.kind);
 assert.equal(runtime.pattern.source,new RegExp(route.pattern).source,"Dynamic route pattern mismatch: "+route.kind);
 for(const sample of route.samples||[]) { assert.ok(new RegExp(route.pattern).test(sample),"Invalid dynamic route sample: "+sample); assert.equal(resolvePageShell(sample),route.shell,"Runtime dynamic route resolution mismatch: "+sample); }
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
