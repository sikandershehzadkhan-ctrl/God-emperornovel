import assert from "node:assert/strict";
import { isSameOriginMutationAllowed } from "../src/request-security.mjs";

const target = "https://imperial.example/api/account";
const request = (method, headers = {}) => new Request(target, { method, headers });

assert.equal(isSameOriginMutationAllowed(request("GET")), true, "safe GET requests remain available without Origin");
assert.equal(isSameOriginMutationAllowed(request("HEAD")), true, "safe HEAD requests remain available without Origin");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://imperial.example" })), true, "same-origin POST is allowed");
assert.equal(isSameOriginMutationAllowed(request("DELETE", { origin: "https://imperial.example" })), true, "same-origin DELETE is allowed");
assert.equal(isSameOriginMutationAllowed(request("POST")), false, "origin-less mutations are rejected");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://attacker.example" })), false, "cross-origin mutations are rejected");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "null" })), false, "opaque origins are rejected");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://imperial.example", "sec-fetch-site": "cross-site" })), false, "cross-site Fetch Metadata is rejected");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://imperial.example", "sec-fetch-site": "none" })), false, "browser-initiated cross-site context is rejected");

console.log("Same-origin mutation security tests passed.");
