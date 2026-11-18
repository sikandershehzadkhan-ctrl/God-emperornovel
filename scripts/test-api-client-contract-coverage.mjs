import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const client = await readFile(new URL("public/app.js", root), "utf8");
const inventory = JSON.parse(await readFile(new URL("docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json", root), "utf8"));
const literal = new Set(inventory.literal_endpoints.map(endpoint => endpoint.path));
const dynamic = inventory.dynamic_endpoints.map(endpoint => endpoint.pattern);

// Capture literal URL arguments passed to api()/apiWithTimeout(). A trailing
// slash denotes a concatenated identifier/action, not a complete endpoint.
const calls = [];
const callPattern = /\bapi(?:WithTimeout)?\(\s*(['"`])([^'"`]+)\1/g;
for (let match; (match = callPattern.exec(client));) {
  const raw = match[2];
  const path = raw.split("?")[0];
  const line = client.slice(0, match.index).split("\n").length;
  const candidates = path.endsWith("/")
    ? [
        ...[...literal].filter(endpoint => endpoint.startsWith(path)),
        ...dynamic.filter(pattern => pattern.startsWith(path))
      ]
    : (literal.has(path) ? [path] : []);
  assert.ok(candidates.length > 0,
    "Client API call has no matching server endpoint or dynamic route family at public/app.js:" + line + " (" + raw + ")");
  calls.push({ line, raw, candidates });
}

assert.ok(calls.length > 0, "Canonical client must contain API call sites");
const distinctExpressions = new Set(calls.map(call => call.raw));
const coveredServerRoutes = new Set(calls.flatMap(call => call.candidates));
console.log(
  "Client API coverage passed: " + calls.length + " call sites, " +
  distinctExpressions.size + " distinct literal path expressions, " +
  coveredServerRoutes.size + " matched server endpoint paths/route families."
);
console.log("Scope: public/app.js literal api()/apiWithTimeout() arguments only; dynamic URL assembly, inline scripts, and separately bundled clients require their own review.");
