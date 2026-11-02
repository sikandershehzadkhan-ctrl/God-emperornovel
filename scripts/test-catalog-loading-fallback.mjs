import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile("public/app.js", "utf8");
const worker = await readFile("src/index.js", "utf8");
const wrangler = await readFile("wrangler.toml", "utf8");

assert.match(app, /async function apiWithTimeout\(path,opt=\{\},timeoutMs=12000\)/);
assert.match(app, /new AbortController\(\)/);
assert.match(app, /clearTimeout\(timer\)/);

const homeStart = app.indexOf("async function home(){");
const catalogStart = app.indexOf("async function catalog(){");
assert.ok(homeStart >= 0 && catalogStart > homeStart);
const home = app.slice(homeStart, catalogStart);
assert.match(home, /apiWithTimeout\('/);
assert.match(home, /catch\(error\)/);
assert.match(home, /Story shelves could not be loaded/);

const loadStart = app.indexOf("async function load(page=1){", catalogStart);
const loadEnd = app.indexOf("form.onsubmit=", loadStart);
assert.ok(loadStart >= 0 && loadEnd > loadStart);
const catalogLoad = app.slice(loadStart, loadEnd);
assert.match(catalogLoad, /apiWithTimeout\('/);
assert.match(catalogLoad, /skeletonCard/);
assert.match(catalogLoad, /catalogRetry/);
assert.match(catalogLoad, /catch\(error\)/);


const catalogStartForAccessibility=app.indexOf("async function catalog(){");
const catalogEndForAccessibility=app.indexOf("async function formatDirectory()",catalogStartForAccessibility);
const catalogSource=app.slice(catalogStartForAccessibility,catalogEndForAccessibility);
for(const label of ["Catalog filters","Search titles, authors, and tropes","Sort catalog","Filter by publication status","Filter by story format","Filter by minimum rating","Filter by genre","Filter by theme or tag","Filter by story language"])assert.ok(catalogSource.includes('aria-label="'+label+'"'),"Discover filter must have an accessible name: "+label);
assert.ok(catalogSource.includes('list="catalogGenreOptions"')&&catalogSource.includes('id="catalogGenreOptions"')&&catalogSource.includes("apiWithTimeout('/api/genres',{},8000)"),"Discover genre filter must offer live taxonomy suggestions.");
assert.ok(catalogSource.includes('list="catalogTagOptions"')&&catalogSource.includes('id="catalogTagOptions"')&&catalogSource.includes("apiWithTimeout('/api/tags',{},8000)"),"Discover tag filter must offer live taxonomy suggestions.");
assert.ok(catalogSource.includes("Promise.allSettled([apiWithTimeout('/api/genres',{},8000),apiWithTimeout('/api/tags',{},8000)])"),"Optional taxonomy suggestions must fail independently without blocking catalog results.");

assert.match(app, /else if\(p==='\/discover'\|\|p==='\/catalog'\)await catalog\(\)/);
assert.match(app, /x==='\/catalog'&&path==='\/discover'/);
assert.match(worker, /"\/discover":"catalog\.html"/);
assert.ok(wrangler.includes('"/catalog", "/discover", "/formats"'), "Wrangler routes /discover through the Worker");
const catalogTemplate = await readFile("public/catalog.html", "utf8");
assert.match(catalogTemplate, /<title>Catalog \| Imperial Novel<\/title>/);
const fetchDispatch = worker.slice(worker.indexOf("export default"));
assert.match(fetchDispatch, /else if\(!p\.includes\("\."\)\)r=await html\(req,env\)/, "Extensionless public routes, including /discover, must reach the HTML router");
assert.ok(worker.includes('"/discover":"catalog.html"'), "The HTML router must map the direct Discover route to the catalog shell");

console.log("PASS: homepage/catalog API requests time out safely, render retry states, and /discover resolves to the catalog.");
