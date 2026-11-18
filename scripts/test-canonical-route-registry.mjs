import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [registryText, pageText, apiText, worker, client, sitemap] = await Promise.all([
  read("docs/architecture/CANONICAL-ROUTE-REGISTRY-2026-11-18.json"),
  read("docs/architecture/IMPERIAL-ROUTE-INVENTORY-BASELINE-2026-11-18.json"),
  read("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json"),
  read("src/index.js"),
  read("public/app.js"),
  read("src/sitemap.mjs"),
]);
const registry = JSON.parse(registryText);
const page = JSON.parse(pageText);
const api = JSON.parse(apiText);

function gitBlobSha(content) {
  return createHash("sha1")
    .update("blob " + Buffer.byteLength(content, "utf8") + "\0" + content, "utf8")
    .digest("hex");
}

assert.equal(registry.registry, "imperial-novel-canonical-route-registry");
assert.equal(registry.status, "source-derived-baseline-not-release-certified");
assert.equal(registry.source_evidence.worker_blob, gitBlobSha(worker), "Canonical registry Worker provenance must match current source");
assert.equal(registry.source_evidence.client_blob, gitBlobSha(client), "Canonical registry client provenance must match current source");
assert.equal(registry.source_evidence.sitemap_blob, gitBlobSha(sitemap), "Canonical registry sitemap provenance must match current source");
assert.equal(registry.source_evidence.worker_blob, api.source_blob, "API inventory and canonical registry must share Worker provenance");

assert.deepEqual(registry.pages.exact, page.page_routes, "Canonical exact page routes must match the observed page inventory");
assert.deepEqual(registry.pages.dynamic, page.dynamic_page_patterns, "Canonical dynamic page families must match the observed page inventory");
assert.equal(new Set(registry.pages.exact.map(route => route.path)).size, registry.pages.exact.length, "Exact page routes must be unique");

assert.equal(registry.api.literal.length, api.literal_endpoints.length, "Canonical literal API routes must match API inventory");
for (const endpoint of registry.api.literal) {
  const source = api.literal_endpoints.find(item => item.path === endpoint.path);
  assert.ok(source, "Literal API route must exist in source inventory: " + endpoint.path);
  assert.deepEqual(endpoint.methods, source.allowed_methods || source.explicit_methods, "Literal API methods must match API inventory: " + endpoint.path);
  assert.ok(endpoint.methods.length > 0, "Literal API methods must be known: " + endpoint.path);
  assert.notEqual(source.method_evidence, "mixed-or-unconstrained-branches", "Literal API method enforcement must be resolved: " + endpoint.path);
  assert.equal(endpoint.review_required, true, "Route baseline must remain review-gated: " + endpoint.path);
}
assert.equal(registry.api.dynamic.length, api.dynamic_endpoints.length, "Canonical dynamic API families must match API inventory");
for (const endpoint of registry.api.dynamic) {
  const source = api.dynamic_endpoints.find(item => item.pattern === endpoint.pattern);
  assert.ok(source, "Dynamic API family must exist in source inventory: " + endpoint.pattern);
  assert.deepEqual(endpoint.allowed_methods, source.allowed_methods, "Dynamic API methods must match API inventory: " + endpoint.pattern);
  assert.deepEqual(endpoint.method_guards, source.method_guards, "Dynamic API guards must match API inventory: " + endpoint.pattern);
  assert.equal(endpoint.access_class, source.access_class, "Dynamic API access class must match API inventory: " + endpoint.pattern);
  assert.equal(endpoint.resource_scope, source.resource_scope, "Dynamic API resource scope must match API inventory: " + endpoint.pattern);
  for (let i = 0; i < endpoint.method_guards.length; i++) {
    const line = worker.split("\n")[endpoint.method_guard_lines[i] - 1] || "";
    assert.ok(line.includes(endpoint.method_guards[i]), "Dynamic API guard must match its source line: " + endpoint.pattern);
  }
}

assert.deepEqual(registry.sitemap.static_paths, page.sitemap_static_paths, "Canonical static sitemap paths must match page inventory");
assert.deepEqual(registry.sitemap.noindex_exact_paths, page.noindex_exact_paths, "Canonical noindex paths must match page inventory");
assert.deepEqual(registry.sitemap.endpoints, page.sitemap_endpoints, "Canonical sitemap endpoints must match page inventory");
assert.ok(registry.known_gaps.length >= 4, "Canonical registry must preserve explicit release-certification gaps");

console.log("Canonical route registry passed: " + registry.pages.exact.length + " exact pages, " + registry.pages.dynamic.length + " dynamic page families, " + registry.api.literal.length + " literal API paths, " + registry.api.dynamic.length + " dynamic API families, " + registry.sitemap.static_paths.length + " static sitemap paths.");
