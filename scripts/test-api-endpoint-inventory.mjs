import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", import.meta.url), "utf8"));
const apiStart = worker.indexOf("async function api(");
const apiEnd = worker.indexOf("async function sitemap(", apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, "Worker API dispatcher boundaries must exist");
const api = worker.slice(apiStart, apiEnd);

const literalPaths = new Set([...api.matchAll(/p\s*===?\s*["']([^"']+)["']/g)].map(match => match[1]));
const manifestPaths = new Set(manifest.literal_endpoints.map(endpoint => endpoint.path));
const literalOccurrences = [...api.matchAll(/p\s*===?\s*["']([^"']+)["']/g)];
assert.equal(literalOccurrences.length, manifest.counts.literal_route_branch_occurrences, "Literal API branch occurrence count must match source");
assert.deepEqual([...manifestPaths].sort(), [...literalPaths].sort(), "API literal path inventory must match Worker dispatcher");

for (const endpoint of manifest.literal_endpoints) {
  assert.ok(endpoint.source_lines.length > 0, "Every literal API endpoint needs source line evidence: " + endpoint.path);
  assert.ok(endpoint.occurrences >= 1, "Every literal API endpoint needs at least one occurrence: " + endpoint.path);
  if (endpoint.method_evidence === "delegated-method-contract") {
    assert.ok(worker.includes("async function communityTaxonomy(req,env)"), "Delegated taxonomy handler must exist");
    assert.ok(worker.includes("if(method==='GET')") && worker.includes("if(method==='POST')") && worker.includes("return json({error:'Method not allowed'},405)"), "Delegated taxonomy handler must explicitly allow GET/POST and reject other methods");
  } else {
    for (const method of endpoint.explicit_methods) {
      assert.ok(api.includes('m==="'+method+'"') || api.includes('m === "'+method+'"') || api.includes("m==='"+method+"'") || api.includes("m === '"+method+"'"), "Explicit method evidence must remain in source: " + endpoint.path + " " + method);
    }
  }
}
for (const endpoint of manifest.dynamic_endpoints) {
  assert.ok(api.includes(endpoint.source), "Dynamic API route expression must remain in source: " + endpoint.pattern);
  assert.ok(endpoint.review_required, "Dynamic API routes must remain flagged for contract review: " + endpoint.pattern);
}
const rating = manifest.literal_endpoints.find(endpoint => endpoint.path === "/api/rating");
assert.ok(rating, "Rating endpoint must be inventoried");
assert.equal(rating.occurrences, 3, "Rating GET and duplicate POST source branches must remain visible until the separate rating integration is reconciled");
assert.ok(rating.explicit_methods.includes("GET") && rating.explicit_methods.includes("POST"), "Rating methods must include GET and POST");

assert.equal(manifest.counts.literal_endpoint_paths, manifest.literal_endpoints.length);
assert.equal(manifest.counts.dynamic_route_families, manifest.dynamic_endpoints.length);
assert.equal(manifest.literal_endpoints.filter(endpoint => endpoint.method_evidence === "mixed-or-unconstrained-branches").length, 0, "Every literal route must have a method contract or an explicitly reviewed delegated method contract");
for (const path of ["/api/health","/api/me","/api/config","/api/genres","/api/tags","/api/public-authors","/api/sources","/api/omni/status","/api/omni/search","/api/omni/resolve","/api/omni/smart-unlock","/api/novels","/api/admin/stats"]) {
  assert.ok(api.includes(`if(p==="${path}"&&m==="GET")`), "Read-only API endpoint must reject non-GET methods: " + path);
}
assert.ok(api.includes('if(p==="/api/taxonomy")return communityTaxonomy(req,env)'), "Taxonomy route must delegate to its method-aware handler");

assert.ok(manifest.literal_endpoints.every(endpoint => endpoint.review_required), "All API endpoints stay review-gated until auth and resource ownership are audited");
console.log(`API inventory source checks passed: ${manifest.literal_endpoints.length} literal paths, ${manifest.counts.literal_route_branch_occurrences} branch occurrences, ${manifest.dynamic_endpoints.length} dynamic route families.`);
