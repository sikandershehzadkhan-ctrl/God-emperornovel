import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const appPath = "public/app.js";
const releaseAppPath = path.join("public", `app-${packageJson.version}.js`);
const workerPath = "src/index.js";
const routeRegistryPath = "src/route-registry.mjs";

for (const file of [appPath, releaseAppPath, workerPath, routeRegistryPath]) {
  assert.ok(fs.existsSync(file), `Required navigation source is missing: ${file}`);
}

const app = fs.readFileSync(appPath, "utf8");
const releaseApp = fs.readFileSync(releaseAppPath, "utf8");
const worker = fs.readFileSync(workerPath, "utf8");
const { resolvePageShell } = await import("../src/route-registry.mjs");

// The Worker serves the versioned application bundle, so navigation evidence
// must come from the same bytes that are shipped to readers.
assert.equal(releaseApp, app, "Versioned application bundle is out of sync with public/app.js");

const exactRoutes = new Set(Object.keys((await import("../src/route-registry.mjs")).PAGE_ROUTE_SHELLS));


function servedByWorker(route) {
  return exactRoutes.has(route) || resolvePageShell(route) !== "404.html";
}

const rawLinks = [...app.matchAll(/href=["'`]([^"'\`]+)["'`]/g)]
  .map(match => match[1])
  .filter(value => value.startsWith("/"));

const destinations = new Set();
const unresolved = [];

for (const raw of rawLinks) {
  const route = raw.split(/[?#]/, 1)[0].replace(/\$\{[^}]+\}/g, "route-param");
  if (!route || route === "/") {
    destinations.add("/");
    continue;
  }

  // These are deliberate concatenation prefixes in the client, not complete
  // destinations. Their corresponding parameterized Worker route is checked.
  if (route === "/novel/" || route === "/read/") {
    destinations.add(route);
    const completedPattern = route === "/read/" ? "/read/123/456" : "/novel/123";
    if (resolvePageShell(completedPattern) === "404.html") {
      unresolved.push({ source: raw, normalized: route, reason: "unmatched dynamic route prefix" });
    }
    continue;
  }

  destinations.add(route);
  if (!servedByWorker(route)) {
    unresolved.push({ source: raw, normalized: route, reason: "no exact or dynamic Worker HTML route" });
  }
}

assert.ok(destinations.size > 0, "No same-origin client navigation destinations were discovered");
assert.deepEqual(unresolved, [], `Client navigation destinations missing Worker routes:\n${JSON.stringify(unresolved, null, 2)}`);

console.log(`Client navigation coverage passed: ${destinations.size} distinct destinations/prefixes resolve to Worker HTML routes; shipped bundle matches source.`);
