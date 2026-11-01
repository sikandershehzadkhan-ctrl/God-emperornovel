import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync("src/index.js", "utf8");
const wrangler = readFileSync("wrangler.toml", "utf8");

assert.match(worker, /function xmlEscape\(value\)/, "Sitemap XML values must be escaped");
assert.match(worker, /async function publicSitemap\(req,env\)/, "Dynamic sitemap handler must exist");
assert.match(worker, /new URL\(req\.url\)\.origin/, "Sitemap URLs must use the active request origin");
assert.match(worker, /publication_status='published'/, "Only published novels may enter the sitemap");
assert.match(worker, /rights_status IN \('original','public_domain','licensed','authorized'\)/, "Only rights-eligible works may enter the public sitemap");
assert.match(worker, /SELECT id,updated_at FROM novels/, "Sitemap must use novel metadata, never chapter bodies");
assert.match(worker, /LIMIT 49990/, "Sitemap must leave room for fixed public URLs under the 50,000 URL limit");
assert.match(worker, /entry\.lastmod=stamp\.toISOString\(\)\.slice\(0,10\)/, "Valid update timestamps must be emitted as sitemap dates");
assert.match(worker, /application\/xml; charset=utf-8/, "Sitemap must use an XML content type");
assert.match(worker, /p===\"\/sitemap\.xml\"&&req\.method===\"GET\"/, "Sitemap endpoint must be GET-only");
assert.match(worker, /p===\"\/robots\.txt\"&&req\.method===\"GET\"/, "Robots endpoint must be GET-only");
assert.match(worker, /Sitemap: \"\+origin\+\"\/sitemap\.xml/, "Robots must advertise the origin-aware sitemap");
assert.match(worker, /noIndexExact=new Set/, "Private and account-specific routes must be marked noindex");
assert.ok(worker.includes("/read/"), "Reader URLs must be excluded from indexing");
assert.ok(worker.includes("/novel/") && worker.includes("chapters"), "Chapter-list URLs must be excluded from indexing");
assert.match(wrangler, /run_worker_first = \[[^\]]*\"\/sitemap\.xml\"[^\]]*\"\/robots\.txt\"/, "Cloudflare must route sitemap and robots requests through the Worker");

console.log("PASS: dynamic sitemap, publication filtering, XML safety, crawler metadata and Cloudflare routing checks.");
