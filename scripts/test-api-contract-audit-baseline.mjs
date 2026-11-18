import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const inventory = JSON.parse(await readFile(new URL("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", root), "utf8"));
const worker = await readFile(new URL("src/index.js", root), "utf8");
const client = await readFile(new URL("public/app.js", root), "utf8");
const audit = await readFile(new URL("docs/architecture/API-CONTRACT-AUDIT-BASELINE-2026-11-18.md", root), "utf8");

assert.equal(inventory.counts.literal_endpoint_paths, 74);
assert.equal(inventory.counts.literal_route_branch_occurrences, 92);
assert.equal(inventory.counts.explicit_method_conditions, 77);
assert.equal(inventory.counts.dynamic_route_families, 21);
assert.equal(inventory.literal_endpoints.filter(x => x.method_evidence !== "explicit-literal-conditions").length, 14);
assert.equal(inventory.literal_endpoints.length, 74);
assert.equal(inventory.dynamic_endpoints.length, 21);

const ratingPost = worker.match(/if\(p===["']\/api\/rating["']&&m===["']POST["']\)[\s\S]*?(?=\n if\()/);
assert.ok(ratingPost, "The rating POST handler must remain discoverable");
assert.match(ratingPost[0], /rating>5/);
assert.match(ratingPost[0], /Rating must be 1-5/);
assert.match(client, /\[5, ['"]5\/5['"]\]/, "Client rating formatter must retain explicit 5-point evidence until coordinated remediation");

for (const path of [
  "/api/health", "/api/taxonomy", "/api/me", "/api/config", "/api/genres",
  "/api/tags", "/api/public-authors", "/api/sources", "/api/omni/status",
  "/api/omni/search", "/api/omni/resolve", "/api/omni/smart-unlock",
  "/api/novels", "/api/admin/stats"
]) {
  assert.ok(inventory.literal_endpoints.some(endpoint => endpoint.path === path && endpoint.method_evidence !== "explicit-literal-conditions"),
    "Method-unverified endpoint must remain in the audit queue: " + path);
}

assert.match(audit, /Unknown values must remain marked \*\*unverified\*\*/);
assert.match(audit, /confirmed contract mismatch/);
assert.match(audit, /No production deployment was performed/);
console.log("API contract audit baseline passed: 74 literal paths, 21 dynamic families, 14 method-unverified paths, and the 1–5 rating mismatch remain explicitly visible.");
