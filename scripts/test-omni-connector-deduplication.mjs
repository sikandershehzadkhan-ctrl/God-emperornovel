import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

const seedStart = source.indexOf("async function seedOmni(env)");
const seedEnd = source.indexOf("async function seedTaxonomy(env)", seedStart);
assert.ok(seedStart >= 0 && seedEnd > seedStart, "OmniPortal registry seeding must remain a dedicated helper");
const seed = source.slice(seedStart, seedEnd);
assert.ok(seed.includes("INSERT INTO connectors(name,base_url,type,enabled,rights_status,last_status) SELECT ?,?,'registry',0,'pending','registry' WHERE NOT EXISTS"), "registry seeding must not rely on INSERT OR IGNORE without a unique constraint");
assert.ok(seed.includes("lower(rtrim(trim(base_url),'/'))=lower(rtrim(trim(?),'/'))"), "registry seed must compare normalized base URLs");
assert.ok(seed.includes(".bind(x[0],baseUrl,baseUrl)"), "registry seed must compare the same canonical URL it inserts");

const statusStart = source.indexOf('if(p==="/api/omni/status"){');
const statusEnd = source.indexOf('if(p==="/api/omni/search"', statusStart);
assert.ok(statusStart >= 0 && statusEnd > statusStart, "OmniPortal status route must exist");
const status = source.slice(statusStart, statusEnd);
assert.ok(status.includes("WHERE c.id=(SELECT c2.id FROM connectors c2"), "public connector status must expose one representative per normalized base URL");
assert.ok(status.includes("lower(rtrim(trim(c2.base_url),'/'))=lower(rtrim(trim(c.base_url),'/'))"), "status deduplication must use the same URL normalization as seeding");
assert.ok(status.includes("ORDER BY CASE WHEN c2.enabled=1 OR c2.rights_status='authorized' THEN 0 ELSE 1 END,c2.id LIMIT 1"), "status deduplication must preserve the enabled or authorized record before older inactive duplicates");

const adminStart = source.indexOf('if(p==="/api/admin/connectors"&&m==="POST"){');
const adminEnd = source.indexOf('if(p==="/api/admin/requests"', adminStart);
assert.ok(adminStart >= 0 && adminEnd > adminStart, "administrator connector creation route must exist");
const adminPost = source.slice(adminStart, adminEnd);
assert.ok(adminPost.includes("await ensureOmniTables(env)"), "connector creation must initialize the canonical connector schema");
assert.ok(adminPost.includes('parsedBaseUrl.protocol!=="https:"'), "connector creation must reject non-HTTPS base URLs");
assert.ok(adminPost.includes("parsedBaseUrl.username||parsedBaseUrl.password"), "connector creation must reject URL credentials");
assert.ok(adminPost.includes("Connector URL is already registered."), "administrator connector creation must reject normalized duplicate URLs");
assert.ok(adminPost.includes("},409)"), "duplicate connector registration must return a conflict without inserting");
assert.ok(adminPost.includes("VALUES(?,?,?,0,'pending')"), "new connectors must remain pending until rights evidence is reviewed");
assert.ok(!adminPost.includes("VALUES(?,?,?,0,'authorized')"), "administrator creation must not bypass the connector rights-authorization gate");

const cleanupStart = source.indexOf('if(p==="/api/admin/connectors/cleanup"');
const cleanupEnd = source.indexOf('if(p==="/api/connector-authorization-requests"', cleanupStart);
assert.ok(cleanupStart >= 0 && cleanupEnd > cleanupStart, "administrator duplicate cleanup route must exist");
const cleanup = source.slice(cleanupStart, cleanupEnd);
assert.ok(cleanup.includes(".trim().replace(/\\\\/+$/,'').toLowerCase()"), "administrator cleanup must normalize whitespace and repeated trailing slashes");

console.log("OmniPortal connector registry idempotency, status deduplication, duplicate-write rejection and pending-rights gate passed.");
