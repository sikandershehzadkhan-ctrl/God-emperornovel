import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SITEMAP_STATIC_PATHS } from "../src/sitemap.mjs";

const manifest = JSON.parse(await readFile(new URL("../docs/architecture/IMPERIAL-ROUTE-INVENTORY-BASELINE-2026-11-18.json", import.meta.url), "utf8"));
const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const sitemapSource = await readFile(new URL("../src/sitemap.mjs", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");

assert.equal(manifest.status, "source-inventory-baseline-not-release-certified");
assert.equal(manifest.source_evidence.worker_file, "src/index.js");
assert.equal(manifest.source_evidence.sitemap_file, "src/sitemap.mjs");

const mapMatch = worker.match(/const map=\{([\s\S]*?)\};if\(map\[p\]\)/);
assert.ok(mapMatch, "Worker exact HTML route map must remain discoverable");
const actualMap = new Map([...mapMatch[1].matchAll(/"([^"]+)":"([^"]+)"/g)].map(match => [match[1], match[2]]));
assert.equal(manifest.page_routes.length, actualMap.size, "manifest exact page route count must match Worker");
assert.equal(new Set(manifest.page_routes.map(route => route.path)).size, manifest.page_routes.length, "exact page routes must be unique");
for (const route of manifest.page_routes) {
  assert.equal(actualMap.get(route.path), route.shell, "Worker shell mismatch for " + route.path);
  assert.ok(route.status === "observed-worker-dispatch", "route must be explicitly marked as observed");
  assert.ok(route.screen_completeness, "screen completeness must never be silently assumed");
}

assert.equal(manifest.dynamic_page_patterns.length, 6, "expected six observed dynamic HTML route families");
for (const route of manifest.dynamic_page_patterns) {
  const pattern = new RegExp(route.pattern);
  assert.ok(route.samples?.length, "dynamic route must include representative samples: " + route.kind);
  for (const sample of route.samples) assert.ok(pattern.test(sample), "dynamic route sample mismatch: " + sample);
  assert.ok(worker.includes(route.source_expression), "Worker dynamic route expression missing: " + route.kind);
}

const apiStart = worker.indexOf("async function api(");
const sitemapStart = worker.indexOf("async function sitemap(");
assert.ok(apiStart >= 0 && sitemapStart > apiStart, "API handler boundaries must be discoverable");
const apiSource = worker.slice(apiStart, sitemapStart);
assert.equal(new Set(manifest.api_route_literals.map(route => route.path)).size, manifest.api_route_literals.length, "API path literals must be unique");
for (const route of manifest.api_route_literals) {
  assert.ok(apiSource.includes(JSON.stringify(route.path)) || apiSource.includes("'" + route.path + "'"), "API path literal missing from handler: " + route.path);
  assert.equal(route.methods, "not-yet-normalized", "unverified API methods must remain explicitly unresolved");
  assert.equal(route.authentication, "not-yet-normalized", "unverified API auth must remain explicitly unresolved");
}

assert.deepEqual([...SITEMAP_STATIC_PATHS], manifest.sitemap_static_paths, "static sitemap list must match the inventory");
assert.ok(sitemapSource.includes("export const SITEMAP_STATIC_PATHS"), "sitemap source must expose its canonical static path list");
for (const endpoint of manifest.sitemap_endpoints) {
  assert.ok(worker.includes('path === "' + endpoint + '"') || worker.includes('path !== "' + endpoint + '"') || worker.includes('path==="' + endpoint + '"') || worker.includes('path!=="' + endpoint + '"'), "Worker sitemap endpoint missing: " + endpoint);
  assert.ok(wrangler.includes('"' + endpoint + '"'), "Cloudflare route missing for " + endpoint);
}

const noindexMatch = worker.match(/const noindex=new Set\(\[([\s\S]*?)\]\)\.has\(p\)/);
assert.ok(noindexMatch, "Worker exact noindex set must remain discoverable");
const actualNoindex = [...noindexMatch[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(actualNoindex, manifest.noindex_exact_paths, "noindex route list must match source");
for (const route of manifest.page_routes) {
  if (manifest.noindex_exact_paths.includes(route.path)) {
    assert.equal(route.access_policy, "noindex-route-authentication-still-requires-server-verification");
  }
}
assert.ok(manifest.known_gaps.some(gap => gap.includes("A noindex directive is not authorization")));
console.log("Route inventory baseline passed: " + manifest.page_routes.length + " exact HTML routes, " + manifest.dynamic_page_patterns.length + " dynamic patterns, " + manifest.api_route_literals.length + " API path literals, and " + manifest.sitemap_endpoints.length + " sitemap endpoints.");
