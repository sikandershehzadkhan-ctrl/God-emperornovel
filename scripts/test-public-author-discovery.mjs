import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [worker,app,served,page,seo,packageJson]=await Promise.all([
 readFile(new URL("../src/index.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/authors.html",import.meta.url),"utf8"),
 readFile(new URL("../src/seo.mjs",import.meta.url),"utf8"),
 readFile(new URL("../package.json",import.meta.url),"utf8")
]);
const start=worker.indexOf('if(p==="/api/public-authors")');
const end=worker.indexOf('if(p==="/api/sources")',start);
assert.ok(start>=0&&end>start,"Public author directory endpoint must be registered.");
const endpoint=worker.slice(start,end);
assert.ok(endpoint.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"),"Directory must exclude unpublished and uncleared works.");
assert.ok(endpoint.includes("slice(0,80)"),"Author search must have a bounded query length.");
assert.ok(endpoint.includes('q.replace(/[\\\\%_]/g,character=>"\\\\")')||endpoint.includes('q.replace(/[\\\\%_]/g,character=>"\\\\\\"+character)'),"LIKE wildcard characters must be escaped.");
assert.ok(endpoint.includes("ESCAPE char(92)"),"Search must treat escaped wildcard characters literally.");
assert.ok(endpoint.includes("LIMIT 50")&&endpoint.includes("LIMIT 100"),"Search and directory output must be bounded.");
const authorFilter=worker.slice(worker.indexOf('if(author){sql+='),worker.indexOf('if(author){sql+=')+300);
assert.ok(authorFilter.includes("n.rights_status IN"),"Author profile story queries must enforce rights clearance.");
assert.ok(worker.includes('"/authors":"authors.html"'),"The authors route must resolve to its dedicated page.");
assert.ok(app.includes("async function authors()")&&app.includes("api('/api/public-authors"),"The client must render the searchable author directory.");
assert.ok(app.includes("p==='/authors')await authors()"),"The client boot router must render /authors.");
assert.equal(app,served,"Editable and served client bundles must remain byte-for-byte synchronized.");
assert.ok(page.includes("/app-17.23.0.js")&&page.includes("Discover Authors"),"The author directory page must load the served application bundle.");
assert.ok(seo.includes('"/authors":{title:"Discover Authors | Imperial Novel"'),"The author directory must have public SEO metadata.");
assert.ok(JSON.parse(packageJson).scripts.build.includes("scripts/test-public-author-discovery.mjs"),"The public author discovery regression test must be registered in the build.");
console.log("PASS: public author discovery is searchable, bounded, rights-cleared, routed, SEO-described and bundle-synchronized.");
