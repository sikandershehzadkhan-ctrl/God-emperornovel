import assert from "node:assert/strict";
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

console.log("Request-origin security tests passed.");
