import assert from "node:assert/strict";
import { isAllowedConnectorSearchUrl } from "../src/connector-url-policy.mjs";

const allow = "api.example.org,search.example.net";
for (const url of [
  "https://api.example.org/search?q={q}",
  "https://v2.api.example.org/find/{q}",
  "https://search.example.net/?term={q}",
  ""
]) assert.equal(isAllowedConnectorSearchUrl(url, allow), true, url);
for (const url of [
  "http://api.example.org/search?q={q}",
  "https://evil.example.org/search?q={q}",
  "https://api.example.org.evil.test/search?q={q}",
  "https://user:pass@api.example.org/search?q={q}",
  "https://api.example.org:8443/search?q={q}",
  "https://127.0.0.1/search?q={q}",
  "https://localhost/search?q={q}",
  "https://service.local/search?q={q}",
  "https://service.internal/search?q={q}",
  "https://[::1]/search?q={q}",
  "https://api.example.org/search?q={q}#fragment",
  "not a URL"
]) assert.equal(isAllowedConnectorSearchUrl(url, allow), false, url);
assert.equal(isAllowedConnectorSearchUrl("https://api.example.org/search", ""), false);
console.log("PASS: connector search URL policy enforces HTTPS, allowlisted hosts and rejects credentials, custom ports, IPs, local hosts, fragments and malformed URLs.");
