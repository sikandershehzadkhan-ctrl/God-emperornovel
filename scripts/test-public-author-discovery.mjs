import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [worker,app,served,page,renderer,seo,routeRegistry,apiMatrix,authMatrix,packageJson]=await Promise.all([
 readFile(new URL("../src/index.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/authors.html",import.meta.url),"utf8"),
 readFile(new URL("../public/authors-page.js",import.meta.url),"utf8"),
 readFile(new URL("../src/seo.mjs",import.meta.url),"utf8"),
 readFile(new URL("../docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json",import.meta.url),"utf8"),
 readFile(new URL("../docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json",import.meta.url),"utf8"),
 readFile(new URL("../docs/architecture/IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json",import.meta.url),"utf8"),
 readFile(new URL("../package.json",import.meta.url),"utf8")
]);
const start=worker.indexOf('if(p==="/api/public-authors")');
const end=worker.indexOf('if(p==="/api/sources"',start);
assert.ok(start>=0&&end>start,"Public author endpoint must be registered");
const endpoint=worker.slice(start,end);
assert.ok(worker.includes('if(p==="/api/public-authors"&&m!=="GET")'),"Author directory API must reject non-GET methods");
assert.ok(endpoint.includes("publication_status='published'"),"Directory must exclude unpublished works");
assert.ok(endpoint.includes("rights_status IN ('original','public_domain','licensed','authorized')"),"Directory must include only rights-cleared works");
assert.ok(endpoint.includes("TRIM(author)<>''"),"Blank author names must not appear in the directory");
assert.ok(endpoint.includes('if(rawQuery.length>80)return json({error:"Search query must be 80 characters or fewer"},400);'),"Search input above 80 characters must be rejected explicitly");
assert.ok(endpoint.indexOf("if(rawQuery.length>80)")<endpoint.indexOf("env.DB.prepare(sql)"),"Overlong search input must be rejected before SQL preparation");
assert.ok(endpoint.includes("q.replace(")&&endpoint.includes("ESCAPE char(92)"),"LIKE wildcard characters must be escaped literally");
assert.ok(endpoint.includes("COALESCE(SUM(views),0)"),"Missing view totals must be represented as zero, not null");
assert.ok(endpoint.includes("rating BETWEEN 1 AND 10"),"Only valid ten-point ratings may contribute to the aggregate");
assert.ok(endpoint.includes("ROUND(AVG(CASE WHEN rating BETWEEN 1 AND 10 THEN rating END))"),"Aggregate ratings must remain whole numbers on the ten-point scale");
assert.ok(endpoint.includes("LIMIT 50")&&endpoint.includes("LIMIT 100"),"Search and directory results must be bounded");
assert.ok(worker.includes('"/authors":"authors.html"'),"The Worker must route /authors to its dedicated shell");
assert.ok(app.includes('href="/authors" data-in-lang>Authors</a>'),"Desktop navigation must expose the localized author directory link");
assert.ok(app.includes('<a href="/authors">${iconSvg("users")} <span data-in-lang>Authors</span></a>'),"Mobile navigation must expose the author directory link");
assert.ok(app.includes("else if(p==='/authors')await authors()"),"Client router must render the author directory");
assert.equal(app,served,"Editable and served 17.23.0 application bundles must be byte-identical");
assert.ok(page.includes("/authors-page.js")&&page.includes("/app-17.23.0.js"),"The author route must load its renderer before the canonical app bundle");
assert.ok(renderer.includes('api("/api/public-authors"'),"The page must use the canonical public author API");
assert.ok(renderer.includes("link.textContent=author")&&renderer.includes("encodeURIComponent(author)"),"Author names must be rendered as text and safely encoded in profile links");
assert.ok(renderer.includes("requestSequence")&&renderer.includes("sequence!==requestSequence"),"Out-of-order search responses must not overwrite newer results");
assert.ok(seo.includes('"/authors"')&&seo.includes('"/authors":{title:"Discover Authors'),"The directory must be included in static SEO and sitemap paths");
const routes=JSON.parse(routeRegistry),api=JSON.parse(apiMatrix),auth=JSON.parse(authMatrix);
assert.ok(routes.routes.some(route=>route.path==="/authors"&&route.shell==="authors.html"&&route.robots==="index"),"Route registry must declare the indexable author directory");
const endpointRoute=api.exactRoutes.find(route=>route.path==="/api/public-authors");
assert.ok(endpointRoute?.methods.includes("GET")&&!endpointRoute.methodGuardMissing,"API method matrix must retain the GET-only contract");
assert.ok(endpointRoute.authorization.includes("public"),"API method matrix must describe the public aggregate projection");
const reviewed=auth.routes.find(route=>route.path==="/api/public-authors"&&route.method==="GET");
assert.equal(reviewed?.access,"public","Authorization matrix must explicitly classify the directory as public");
assert.ok(reviewed.ownerRule.includes("rights-eligible")&&reviewed.tests.length>=4,"Public author aggregate must document its rights boundary and regressions");
assert.ok(JSON.parse(packageJson).scripts.build.includes("scripts/test-public-author-discovery.mjs"),"The author directory regression must run in the required build");
console.log("PASS: public author discovery is routed, searchable, localized, bounded, rights-cleared, SEO-indexable and bundle-synchronized.");
