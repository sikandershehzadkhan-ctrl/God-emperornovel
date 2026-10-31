import assert from "node:assert/strict";
import { isSameOriginMutationAllowed } from "../src/request-origin-policy.mjs";

const target = "https://imperial.example/api/account";
const request = (method, headers = {}) => new Request(target, { method, headers });

assert.equal(isSameOriginMutationAllowed(request("GET")), true, "GET is safe");
assert.equal(isSameOriginMutationAllowed(request("HEAD")), true, "HEAD is safe");
assert.equal(isSameOriginMutationAllowed(request("OPTIONS")), true, "OPTIONS is safe");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://imperial.example" })), true, "same-origin POST is allowed");
assert.equal(isSameOriginMutationAllowed(request("POST", { origin: "https://attacker.example" })), false, "foreign-origin POST is blocked");
assert.equal(isSameOriginMutationAllowed(request("POST")), false, "origin-less mutation is blocked");
assert.equal(isSameOriginMutationAllowed(request("DELETE", { origin: "https://imperial.example", "sec-fetch-site": "cross-site" })), false, "cross-site fetch metadata is blocked");
assert.equal(isSameOriginMutationAllowed(request("PATCH", { origin: "https://imperial.example", "sec-fetch-site": "none" })), false, "opaque fetch context is blocked");
console.log("Same-origin mutation policy tests passed.");
