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
const sourceOccurrences = new Map();
const sourcePattern = /p\s*===?\s*["']([^"']+)["']/g;
let sourceMatch;
while ((sourceMatch = sourcePattern.exec(api))) {
  const line = worker.slice(0, apiStart + sourceMatch.index).split("\n").length;
  const existing = sourceOccurrences.get(sourceMatch[1]) || [];
  existing.push(line);
  sourceOccurrences.set(sourceMatch[1], existing);
}
for (const endpoint of manifest.literal_endpoints) {
  const actualLines = [...new Set(sourceOccurrences.get(endpoint.path) || [])];
  assert.deepEqual(endpoint.source_lines, actualLines, "API source line evidence must match current Worker source: " + endpoint.path);
  assert.equal(endpoint.occurrences, (sourceOccurrences.get(endpoint.path) || []).length, "API branch occurrence evidence must match current Worker source: " + endpoint.path);
}
assert.equal([...sourceOccurrences.values()].reduce((sum, values) => sum + values.length, 0), manifest.counts.literal_route_branch_occurrences, "Total literal branch count must match current Worker source");
assert.equal(manifest.source_line_count, worker.split("\n").length, "Inventory source line count must match Worker source");
assert.equal(literalOccurrences.length, manifest.counts.literal_route_branch_occurrences, "Literal API branch occurrence count must match source");
assert.deepEqual([...manifestPaths].sort(), [...literalPaths].sort(), "API literal path inventory must match Worker dispatcher");

for (const endpoint of manifest.literal_endpoints) {
  assert.ok(endpoint.source_lines.length > 0, "Every literal API endpoint needs source line evidence: " + endpoint.path);
  assert.ok(endpoint.occurrences >= 1, "Every literal API endpoint needs at least one occurrence: " + endpoint.path);
  for (const method of endpoint.explicit_methods) {
    assert.ok(api.includes(`m===\"${method}\"`) || api.includes(`m === \"${method}\"`) || api.includes(`m==='${method}'`) || api.includes(`m === '${method}'`), "Explicit method evidence must remain in source: " + endpoint.path + " " + method);
  }
}
for (const endpoint of manifest.dynamic_endpoints) {
  assert.ok(api.includes(endpoint.source), "Dynamic API route expression must remain in source: " + endpoint.pattern);
  assert.ok(endpoint.review_required, "Dynamic API routes must remain flagged for contract review: " + endpoint.pattern);
}

const taxonomy = manifest.literal_endpoints.find(endpoint => endpoint.path === "/api/taxonomy");
assert.ok(taxonomy, "Taxonomy endpoint must be inventoried");
assert.deepEqual(taxonomy.allowed_methods, ["GET", "POST"], "Delegated taxonomy methods must be explicit in the inventory");
assert.equal(taxonomy.method_evidence, "delegated-method-dispatch");
const taxonomyStart = worker.indexOf("async function communityTaxonomy(");
const taxonomyEnd = worker.indexOf("async function adminTaxonomy(", taxonomyStart);
assert.ok(taxonomyStart >= 0 && taxonomyEnd > taxonomyStart, "Delegated taxonomy handler boundaries must exist");
const taxonomyHandler = worker.slice(taxonomyStart, taxonomyEnd);
assert.ok(taxonomyHandler.includes("if(method==='GET')") && taxonomyHandler.includes("if(method==='POST')"), "Taxonomy handler must explicitly allow GET and POST");
assert.ok(taxonomyHandler.includes("return json({error:'Method not allowed'},405)"), "Taxonomy handler must reject unsupported methods");

const rating = manifest.literal_endpoints.find(endpoint => endpoint.path === "/api/rating");
assert.ok(rating, "Rating endpoint must be inventoried");
assert.equal(rating.occurrences, 3, "Rating GET and duplicate POST source branches must remain visible until the separate rating integration is reconciled");
assert.ok(rating.explicit_methods.includes("GET") && rating.explicit_methods.includes("POST"), "Rating methods must include GET and POST");

assert.equal(manifest.counts.literal_endpoint_paths, manifest.literal_endpoints.length);
assert.equal(manifest.counts.dynamic_route_families, manifest.dynamic_endpoints.length);
assert.equal(manifest.literal_endpoints.filter(endpoint => endpoint.method_evidence === "mixed-or-unconstrained-branches").length, 13, "Method-unresolved literal paths must remain visible until reviewed");
assert.ok(manifest.literal_endpoints.every(endpoint => endpoint.review_required), "All API endpoints stay review-gated until auth and resource ownership are audited");
console.log(`API inventory source checks passed: ${manifest.literal_endpoints.length} literal paths, ${manifest.counts.literal_route_branch_occurrences} branch occurrences, ${manifest.dynamic_endpoints.length} dynamic route families.`);
