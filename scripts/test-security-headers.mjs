import assert from "node:assert/strict";
import { withSecurityHeaders } from "../src/security-headers.mjs";

const request = new Request("https://example.test/");
const response = withSecurityHeaders(new Response("ok"), request);
assert.equal(response.headers.get("x-content-type-options"), "nosniff");
assert.equal(response.headers.get("x-frame-options"), "DENY");
assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
assert.match(response.headers.get("content-security-policy-report-only") || "", /object-src 'none'/);
assert.match(response.headers.get("content-security-policy-report-only") || "", /frame-ancestors 'none'/);
assert.match(response.headers.get("strict-transport-security") || "", /max-age=31536000/);

const custom = withSecurityHeaders(new Response("ok", { headers: { "X-Frame-Options": "SAMEORIGIN", "Cache-Control": "no-store" } }), request);
assert.equal(custom.headers.get("x-frame-options"), "SAMEORIGIN", "existing explicit policy is preserved");
assert.equal(custom.headers.get("cache-control"), "no-store", "unrelated headers are preserved");

const local = withSecurityHeaders(new Response("ok"), new Request("http://localhost/"));
assert.equal(local.headers.get("strict-transport-security"), null, "HSTS is HTTPS-only");
console.log("Security response-header policy tests passed.");
