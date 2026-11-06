import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const routes = [
  "/api/health", "/api/me", "/api/config", "/api/genres", "/api/tags",
  "/api/public-authors", "/api/sources", "/api/omni/status",
  "/api/omni/search", "/api/omni/resolve", "/api/omni/smart-unlock"
];
for (const path of routes) {
  const guard = 'if(p==="' + path + '"&&m!=="GET")return json({error:"Method not allowed"},405);';
  const index = source.indexOf(guard);
  assert.ok(index >= 0, path + " must reject non-GET methods");
  const handler = source.indexOf('if(p==="' + path + '"', index + guard.length);
  assert.ok(handler > index, path + " GET handler must follow its method guard");
}
console.log("PASS: all 11 read-only API endpoints reject non-GET methods before handler work.");
