import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const versioned = readFileSync(new URL("../public/app-17.20.0.js", import.meta.url), "utf8");
const start = app.indexOf("function initTvmazeSearch()");
const end = app.indexOf("\nasync function omni(){", start);
assert.ok(start >= 0 && end > start, "TVmaze search helper must exist before OmniPortal");
const helper = app.slice(start, end);

assert.equal(app, versioned, "versioned and unversioned browser entrypoints must remain byte-identical");
assert.match(app, /id="tvmazeSearch"/, "OmniPortal must render the TVmaze search form");
assert.match(helper, /https:\/\/api\.tvmaze\.com\/search\/shows\?q=/, "search must use the official TVmaze public endpoint");
assert.match(helper, /mode:'cors'/, "search must use the provider's documented browser CORS support");
assert.match(helper, /credentials:'omit'/, "search must not send Imperial Novel cookies to TVmaze");
assert.match(helper, /cache:'default'/, "search must respect normal HTTP caching");
assert.match(helper, /response\.status===429/, "provider rate limits must be handled");
assert.match(helper, /setTimeout\(\(\)=>controller\.abort\(\),10000\)/, "provider requests must have a bounded timeout");
assert.match(helper, /clearTimeout\(timeout\)/, "provider timeout must be cleared after completion");
assert.match(helper, /slice\(0,12\)/, "displayed result count must be bounded");
assert.match(helper, /slice\(0,100\)/, "query length must be bounded");
assert.match(helper, /esc\(show\.name/, "untrusted provider titles must be escaped");
assert.match(helper, /replace\(\/<\[\^>\]\*>\/g,' '\)/, "provider HTML summaries must be reduced to plain text before escaping");
assert.match(helper, /www\.tvmaze\.com/, "provider attribution and source links must be present");
assert.match(app, /licensed under CC BY-SA/, "the provider's share-alike licence must be disclosed");
assert.doesNotMatch(helper, /show\.image|show\.episodes|videoPlayer|<video|playback/, "metadata search must not embed artwork or provide episode streaming");
assert.doesNotMatch(helper, /api\('\/api\/omni\/import/, "TVmaze results must not be routed into automatic source import");
console.log("PASS: TVmaze metadata search is user-triggered, bounded, CORS-only, cookie-free, cached, rate-limit aware, attributed and does not stream or rehost media.");
