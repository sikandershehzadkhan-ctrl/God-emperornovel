import assert from "node:assert/strict";
import fs from "node:fs";
import { canImportConnectorMetadata, deduplicateConnectorRows, normalizeConnectorBaseUrl, summarizeConnectorRows } from "../src/omni-connector-policy.mjs";

const base={id:1,name:"FictionZone",base_url:"https://fictionzone.net",type:"registry",enabled:0,rights_status:"pending",last_status:"registry",search_url:"",metadata_import_allowed:0};
const duplicate=[
 {...base,id:7,name:"FictionZone duplicate",base_url:"https://fictionzone.net/",enabled:0,rights_status:"pending"},
 {...base,id:9,name:"FictionZone approved",enabled:1,rights_status:"authorized",search_url:"https://api.fictionzone.net/search?q={q}",rights_evidence_url:"https://fictionzone.net/terms",metadata_import_allowed:1,last_status:"online",last_checked_at:"2026-11-01 10:00:00"},
 {...base,id:10,name:"FictionZone stale",enabled:0,rights_status:"authorized",search_url:"",rights_evidence_url:"https://fictionzone.net/terms"}
];
assert.equal(normalizeConnectorBaseUrl("https://fictionzone.net/"),"https://fictionzone.net");
assert.equal(normalizeConnectorBaseUrl("http://fictionzone.net"),"");
assert.equal(normalizeConnectorBaseUrl("https://user:pass@fictionzone.net"),"");
const unique=deduplicateConnectorRows(duplicate);
assert.equal(unique.length,1,"Duplicate base URLs must collapse to one provider record.");
assert.equal(unique[0].id,9,"The most complete authorized and enabled record must win.");
const counts=summarizeConnectorRows(duplicate);
assert.deepEqual(counts,{registered:1,authorized:1,enabled:1,search_ready:1,online:1});
assert.equal(canImportConnectorMetadata(unique[0]),true);
assert.equal(canImportConnectorMetadata({...unique[0],metadata_import_allowed:0}),false);
assert.equal(canImportConnectorMetadata({...unique[0],enabled:0}),false);
assert.equal(canImportConnectorMetadata({...unique[0],rights_status:"pending"}),false);
assert.equal(deduplicateConnectorRows([{...base,base_url:"http://bad.example"}]).length,0);

const worker=fs.readFileSync("src/index.js","utf8");
const app=fs.readFileSync("public/app.js","utf8");
const release=fs.readFileSync("public/app-17.23.0.js","utf8");
assert.ok(worker.includes("WHERE NOT EXISTS(SELECT 1 FROM connectors"),"Provider registry seeding must be idempotent.");
assert.ok(worker.includes("deduplicateConnectorRows(raw)"),"Public provider status must deduplicate existing records.");
assert.ok(worker.includes("summarizeConnectorRows(sources)"),"Provider metrics must be derived from the deduplicated registry.");
assert.ok(worker.includes("isAllowedConnectorSearchUrl(row.search_url,env.CONNECTOR_HOST_ALLOWLIST)"),"Search readiness must require an allowlisted HTTPS endpoint.");
assert.ok(worker.includes("find(canImportConnectorMetadata)"),"Metadata imports must require explicit provider permission.");
assert.ok(worker.includes("metadata_import_allowed:Number(connector.metadata_import_allowed)===1"),"External search results must carry provider-specific import permission.");
assert.ok(worker.includes("target.protocol!=='https:'"),"External result links must reject non-HTTPS URLs.");
assert.ok(worker.includes("target.hostname===base.hostname||target.hostname.endsWith('.'+base.hostname)"),"External result links must stay within the connector host.");
assert.ok(app.includes("LIVE PROVIDER STATUS")&&app.includes("Connection directory"),"OmniPortal must show its live provider directory.");
assert.ok(app.includes("Registered")&&app.includes("Rights-authorized")&&app.includes("Search-ready")&&app.includes("Online"),"Provider status must distinguish registration, rights, readiness and health.");
assert.ok(app.includes("external&&item.metadata_import_allowed"),"Import action must only appear when the provider permits metadata imports.");
assert.ok(app.includes("No paywall bypass. No DRM circumvention."),"OmniPortal must state its rights and access boundaries.");
assert.equal(app,release,"Editable and versioned browser bundles must remain synchronized.");
console.log("OmniPortal deduplication, rights gates, provider readiness, safe result links and UI integration tests passed.");
