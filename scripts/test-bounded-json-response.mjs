import assert from "node:assert/strict";
import fs from "node:fs";
import { readBoundedJsonResponse } from "../src/platform/bounded-json-response.mjs";

const valid = new Response(JSON.stringify({ results: [{ title: "Allowed" }] }), {
  status: 200,
  headers: { "content-type": "application/json; charset=utf-8" }
});
assert.deepEqual(await readBoundedJsonResponse(valid), { results: [{ title: "Allowed" }] });

const vendorJson = new Response('{"ok":true}', {
  headers: { "content-type": "application/vnd.imperial.search+json" }
});
assert.deepEqual(await readBoundedJsonResponse(vendorJson), { ok: true });

await assert.rejects(
  readBoundedJsonResponse(new Response("<html>blocked</html>", {
    headers: { "content-type": "text/html" }
  })),
  /must be JSON/
);
await assert.rejects(
  readBoundedJsonResponse(new Response("{}", { status: 503, headers: { "content-type": "application/json" } })),
  /not successful/
);
await assert.rejects(
  readBoundedJsonResponse(new Response('{"ok":true}', {
    headers: { "content-type": "application/json", "content-length": "9999" }
  }), 100),
  /size limit/
);
await assert.rejects(
  readBoundedJsonResponse(new Response(JSON.stringify({ data: "x".repeat(256) }), {
    headers: { "content-type": "application/json" }
  }), 100),
  /size limit/
);
await assert.rejects(
  readBoundedJsonResponse(new Response("{broken", {
    headers: { "content-type": "application/json" }
  })),
  SyntaxError
);
await assert.rejects(
  readBoundedJsonResponse(new Response(new Uint8Array([0xff, 0xfe]), {
    headers: { "content-type": "application/json" }
  })),
  TypeError
);
await assert.rejects(
  readBoundedJsonResponse(new Response(null, {
    headers: { "content-type": "application/json" }
  })),
  /body is missing/
);
await assert.rejects(
  readBoundedJsonResponse(new Response("{}", {
    headers: { "content-type": "application/json" }
  }), 0),
  /positive safe-integer/
);

const worker = fs.readFileSync("src/index.js", "utf8");
const searchStart = worker.indexOf('if(p==="/api/omni/search")');
const searchEnd = worker.indexOf('if(p==="/api/omni/resolve")', searchStart);
assert.ok(searchStart >= 0 && searchEnd > searchStart, "Canonical OmniPortal search route must exist");
const searchRoute = worker.slice(searchStart, searchEnd);
assert.ok(searchRoute.includes(".trim().slice(0,120)"), "Connector search input must be bounded to 120 characters");
assert.ok(searchRoute.includes("rights_status='authorized'") && searchRoute.includes("LIMIT 8"),
  "External connector fan-out must remain rights-gated and bounded to eight providers");

const connectorStart = worker.indexOf("async function omniConnectorSearch");
const connectorEnd = worker.indexOf("\nasync function ensureOmniTables", connectorStart);
assert.ok(connectorStart >= 0 && connectorEnd > connectorStart, "Connector search helper must exist");
const connectorSearch = worker.slice(connectorStart, connectorEnd);
assert.ok(connectorSearch.includes("readBoundedJsonResponse(r,1_048_576)"),
  "External connector JSON must use the 1 MiB streaming response limit");
assert.ok(!connectorSearch.includes("await r.json()"),
  "Unbounded Response.json() must not be used for external connector bodies");

console.log("Bounded OmniPortal response tests passed: content type, declared and streamed byte limits, UTF-8/JSON parsing, query bounds and authorized connector fan-out.");
