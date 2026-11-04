import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCoverUrl } from "../src/cover-url-policy.mjs";

const valid = ["/covers/ascendant.jpg", "/covers/my-cover_2.webp", "/covers/UPPER.PNG", "/story-cover-placeholder.svg"];
for (const value of valid) assert.equal(normalizeCoverUrl(value), value);

const invalid = [
  "https://images.example/cover.jpg", "//images.example/cover.jpg", "http://example.com/a.jpg",
  "javascript:alert(1)", "data:image/svg+xml,<svg/>", "file:///etc/passwd",
  "/covers/../secret.jpg", "/covers/%2e%2e/secret.jpg", "/covers/a.jpg?track=1",
  "/covers/a.jpg#fragment", "/covers/a\\b.jpg", "/covers/a.svg", "/covers/",
  "/covers/a.jpg:443", "https://user:pass@example.com/a.jpg", "https://127.0.0.1/a.jpg",
  "https://[::1]/a.jpg", " /covers/a.jpg ", "x".repeat(181), 42, {}
];
for (const value of invalid) assert.equal(normalizeCoverUrl(value), null, String(value));
assert.equal(normalizeCoverUrl(""), "/story-cover-placeholder.svg");
assert.equal(normalizeCoverUrl(undefined), "/story-cover-placeholder.svg");

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const client = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.equal(worker.split("normalizeCoverUrl(").length - 1, 4, "all author/admin cover write routes must validate");
assert.ok(worker.includes("img-src 'self' data:"), "default CSP must restrict images to local/data sources");
assert.ok(worker.includes(".test(p)?\\" https:\\""), "only comic reader routes may opt into HTTPS page images");
assert.ok(client.includes("/story-cover-placeholder.svg"), "client must use a safe local fallback");
console.log("Cover URL policy and integration tests passed.");
