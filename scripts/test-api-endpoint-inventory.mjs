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
  if (endpoint.method_evidence === "centralized-method-contract") {
    assert.ok(api.includes(JSON.stringify(endpoint.path) + ":" + JSON.stringify(endpoint.explicit_methods)), "Centralized method contract must remain in source: " + endpoint.path);
  } else {
    for (const method of endpoint.explicit_methods) {
      assert.ok(api.includes('m==="' + method + '"') || api.includes("m === \"" + method + "\"") || api.includes("m==='" + method + "'") || api.includes("m === '" + method + "'"), "Explicit method evidence must remain in source: " + endpoint.path + " " + method);
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
assert.equal(manifest.counts.centralized_method_contract_paths, 14, "All previously unconstrained paths must have centralized method contracts");
assert.equal(manifest.counts.unresolved_method_paths, 0, "No literal API path may remain method-unresolved");
assert.equal(manifest.literal_endpoints.filter(endpoint => endpoint.method_evidence === "centralized-method-contract").length, 14);
assert.ok(manifest.literal_endpoints.every(endpoint => endpoint.review_required), "All API endpoints stay review-gated until auth and resource ownership are audited");
console.log("API inventory source checks passed: 74 literal paths, 91 branch occurrences, 21 dynamic families, 14 centralized method contracts, zero unresolved literal methods.");
