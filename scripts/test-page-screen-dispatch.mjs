import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [screenText, routeText, worker, client, packageText] = await Promise.all([
  read("docs/architecture/PAGE-SCREEN-CAPABILITY-INVENTORY-2026-11-18.json"),
  read("docs/architecture/IMPERIAL-ROUTE-INVENTORY-BASELINE-2026-11-18.json"),
  read("src/index.js"),
  read("public/app.js"),
  read("package.json"),
]);
const screen = JSON.parse(screenText);
const route = JSON.parse(routeText);
const pkg = JSON.parse(packageText);
const versionedClient = await read("public/app-" + pkg.version + ".js");

assert.equal(screen.status, "source-derived-renderer-inventory-not-visual-qa-certified");
assert.equal(screen.source_evidence.active_app_version, pkg.version);
assert.equal(versionedClient, client, "Versioned application bundle must be byte-identical to public/app.js");
assert.equal(screen.exact_routes.length, route.page_routes.length);
assert.equal(screen.dynamic_routes.length, route.dynamic_page_patterns.length);

const mapMatch = worker.match(/const map=\{([\s\S]*?)\};if\(map\[p\]\)/);
assert.ok(mapMatch, "Worker exact page shell map must remain discoverable");
const actualMap = new Map([...mapMatch[1].matchAll(/"([^"]+)":"([^"]+)"/g)].map(match => [match[1], match[2]]));
const bootStart = client.lastIndexOf("async function boot()");
assert.ok(bootStart >= 0, "Shared application boot dispatcher must exist");
const boot = client.slice(bootStart);

for (const page of screen.exact_routes) {
  assert.equal(actualMap.get(page.path), page.shell, "Worker shell mismatch for " + page.path);
  assert.equal(page.renderer_present, true, "Renderer must be present for " + page.path);
  const shell = await read("public/" + page.shell);
  assert.ok(shell.length > 0, "Page shell must exist for " + page.path);
  if (page.shell_type === "spa" || page.shell_type === "spa-shell") {
    assert.ok(page.dispatch && boot.includes(page.dispatch), "Shared app dispatch must invoke the recorded renderer for " + page.path);
    const renderer = page.renderer.split(":")[0];
    assert.ok(client.includes("function " + renderer + "(") || client.includes("async function " + renderer + "("), "Shared renderer function must exist for " + page.path);
  } else if (page.shell_type === "standalone") {
    assert.ok(shell.includes("<script"), "Standalone page must include its own script: " + page.path);
  } else if (page.shell_type === "static-document") {
    assert.ok(shell.includes("<body"), "Static legal document must contain a body: " + page.path);
  }
  for (const field of ["visual_qa","interaction_qa","responsive_qa","accessibility_qa","locale_rtl_qa","deployed_direct_load_qa"]) {
    assert.equal(page[field], "not-verified", "Do not imply unperformed QA for " + page.path + " (" + field + ")");
  }
}

for (const family of screen.dynamic_routes) {
  const baseline = route.dynamic_page_patterns.find(item => item.pattern === family.pattern);
  assert.ok(baseline, "Dynamic page family must match route baseline: " + family.pattern);
  assert.ok(worker.includes(family.source_expression), "Dynamic page family must remain in Worker source: " + family.pattern);
  assert.ok(client.includes(family.client_source_expression), "Dynamic page behavior must remain in client source: " + family.pattern);
  if (!family.renderer.startsWith("redirect:")) {
    const renderer = family.renderer.split(":")[0];
    assert.ok(client.includes("function " + renderer + "(") || client.includes("async function " + renderer + "("), "Dynamic renderer function must exist: " + family.pattern);
  }
}

assert.ok(screen.acceptance_gaps.some(gap => gap.includes("live browser")));
assert.ok(screen.asset_observations.some(note => note.includes("rewrites legacy shell asset references")));
console.log("Page screen capability inventory passed: " + screen.exact_routes.length + " exact routes, " + screen.dynamic_routes.length + " dynamic families, version " + pkg.version + " bundle parity. Visual and browser QA remain explicitly unverified.");
