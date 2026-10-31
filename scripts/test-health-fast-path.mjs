import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf("async function api(req,env){");
const end = source.indexOf('if(p==="/api/agents"', start);
assert.ok(start >= 0 && end > start, "API dispatcher must remain present");
const prefix = source.slice(start, end);
const health = prefix.indexOf('if(p==="/api/health"&&m==="GET")');
const schema = prefix.indexOf("await ensureCoreSchema(env)");
const runtimeFeatures = prefix.indexOf("await ensureRuntimeFeatureSchema(env)");
const session = prefix.indexOf("await getUser(req,env)");
assert.ok(health >= 0 && health < schema, "health check must execute before schema bootstrap");
assert.ok(runtimeFeatures > schema && health < runtimeFeatures, "health check must bypass DDL and runtime feature schema setup");
assert.ok(health < session, "health check must not require session lookup");
assert.ok(prefix.slice(health, schema).includes('env.DB.prepare("SELECT 1").first()'), "health check must perform a lightweight database probe");
console.log("PASS: GET /api/health is a fast path before schema setup and session lookup.");
