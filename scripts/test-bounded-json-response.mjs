import assert from "node:assert/strict";
import { readBoundedJsonResponse } from "../src/bounded-json-response.mjs";

const valid = new Response(JSON.stringify({ results: [{ title: "Allowed" }] }), {
  status: 200,
  headers: { "content-type": "application/json; charset=utf-8" }
});
assert.deepEqual(await readBoundedJsonResponse(valid), { results: [{ title: "Allowed" }] });

await assert.rejects(
  readBoundedJsonResponse(new Response("<html>blocked</html>", { headers: { "content-type": "text/html" } })),
  /must be JSON/
);
await assert.rejects(
  readBoundedJsonResponse(new Response('{"ok":true}', { headers: { "content-type": "application/json", "content-length": "9999" } }), 100),
  /size limit/
);
await assert.rejects(
  readBoundedJsonResponse(new Response(JSON.stringify({ data: "x".repeat(256) }), { headers: { "content-type": "application/json" } }), 100),
  /size limit/
);
await assert.rejects(
  readBoundedJsonResponse(new Response("{broken", { headers: { "content-type": "application/json" } })),
  SyntaxError
);
console.log("Bounded connector JSON response tests passed.");
