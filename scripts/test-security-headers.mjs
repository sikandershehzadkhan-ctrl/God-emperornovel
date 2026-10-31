import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf("const secure=response=>{");
assert.ok(start >= 0, "shared response hardening function must exist");
const end = source.indexOf("};", start);
assert.ok(end > start, "shared response hardening function must be complete");
const secure = source.slice(start, end);
const required = [
  'x-content-type-options","nosniff',
  'referrer-policy","strict-origin-when-cross-origin',
  'strict-transport-security","max-age=31536000; includeSubDomains',
  'x-frame-options","SAMEORIGIN',
  'x-permitted-cross-domain-policies","none',
  'x-download-options","noopen',
  'x-dns-prefetch-control","off',
  'origin-agent-cluster","?1',
  'cross-origin-opener-policy","same-origin-allow-popups'
];
for (const item of required) assert.ok(secure.includes(item), "Missing response security header: " + item);
console.log("PASS: Worker response security headers are enforced globally.");