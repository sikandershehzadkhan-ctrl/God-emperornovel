import assert from "node:assert/strict";
import fs from "node:fs";
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

const worker = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
assert.ok(worker.includes("frame-ancestors 'none'"), "HTML must refuse framing to prevent clickjacking");
assert.ok(worker.includes("object-src 'none'"), "CSP must disable plugin content");
assert.ok(worker.includes("base-uri 'self'"), "CSP must restrict base URL injection");
assert.ok(worker.includes("form-action 'self'"), "CSP must restrict form submission destinations");
assert.ok(!worker.includes("unsafe-eval"), "CSP must not enable eval-based script execution");
assert.ok(worker.includes('h.set("x-content-type-options","nosniff")'), "all responses must prevent MIME sniffing");
assert.ok(worker.includes('h.set("strict-transport-security","max-age=31536000; includeSubDomains")'), "all responses must enforce HTTPS");
assert.ok(worker.includes('h.set("cross-origin-opener-policy","same-origin")'), "all responses must isolate browsing contexts");
assert.ok(worker.includes('h.set("cross-origin-resource-policy","same-origin")'), "all responses must prevent cross-origin resource embedding");
assert.ok(worker.includes("HttpOnly; Secure; SameSite=Lax"), "session cookies must be HttpOnly, Secure and SameSite protected");

console.log("Security header and session cookie policy tests passed.");
