import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSameOriginMutationAllowed } from "../src/request-security.mjs";

const site = "https://imperialnovel.example";
const request = (method, headers = {}) => new Request(site + "/api/example", { method, headers });

assert.equal(isSameOriginMutationAllowed(request("GET")), true, "safe GET requests do not require Origin");
assert.equal(isSameOriginMutationAllowed(request("OPTIONS")), true, "preflight OPTIONS remains safe");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: site, "sec-fetch-site": "same-origin" })), true, "same-origin browser mutation is accepted");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://attacker.example", "sec-fetch-site": "cross-site" })), false, "cross-origin mutation is rejected");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: site, "sec-fetch-site": "cross-site" })), false, "cross-site fetch metadata is rejected even with a forged Origin in a test harness");
assert.equal(isSameOriginMutationAllowed(request("POST", { "sec-fetch-site": "same-origin" })), false, "mutation without Origin is rejected");
assert.equal(isSameOriginMutationAllowed(request("DELETE", { origin: site, "sec-fetch-site": "same-origin" })), true, "same-origin DELETE is accepted");

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
assert.ok(worker.includes('p.startsWith("/api/")&&!isSameOriginMutationAllowed(req,requestUrl)'), "Worker rejects API mutations that fail the origin policy");
assert.ok(worker.includes("async function communityTaxonomy(req,env,user)"), "taxonomy handler receives the authenticated session");
assert.ok(worker.includes("const authError=need(user);if(authError)return authError;"), "taxonomy proposals require authentication");
assert.ok(worker.includes("user.id,String(user.username||'').slice(0,80)"), "taxonomy attribution is derived from the session");
assert.ok(!worker.includes("b.creator_id||null") && !worker.includes("b.creator_name||''"), "taxonomy request body cannot spoof submitter identity");

console.log("Request-origin and taxonomy identity security tests passed.");
