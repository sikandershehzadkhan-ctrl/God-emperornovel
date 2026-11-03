import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json"),"utf8"));
const worker=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const clientFile=fs.existsSync(path.join(root,"public/app-17.23.0.js"))?"public/app-17.23.0.js":"public/app.js";
const client=fs.readFileSync(path.join(root,clientFile),"utf8");
assert.equal(manifest.schemaVersion,1);
assert.ok(manifest.routes.length>=30,"exact route inventory unexpectedly small");
assert.ok(manifest.patterns.length>=5,"dynamic route inventory unexpectedly small");
const paths=manifest.routes.map(x=>x.path);
assert.equal(new Set(paths).size,paths.length,"duplicate exact route path");
for(const r of manifest.routes){
 assert.ok(r.path.startsWith("/")&&r.shell&&r.screen&&r.renderer,"incomplete route metadata: "+r.path);
 if(r.aliasOf)assert.ok(paths.includes(r.aliasOf),"missing alias target: "+r.aliasOf);
 if(r.robots==="noindex")assert.ok(manifest.noindexExact.includes(r.path),"noindex list mismatch: "+r.path);
 assert.ok(worker.includes(JSON.stringify(r.path)),"Worker exact route missing: "+r.path);
}
for(const r of manifest.patterns){
 const re=new RegExp(r.pattern);
 for(const sample of r.samples)assert.ok(re.test(sample),"pattern sample mismatch: "+sample);
 const family=r.samples[0].split("/")[1];
 assert.ok(worker.includes(family),"Worker dynamic route family missing: "+family);
}
for(const r of manifest.routes){
 if(r.renderer==="standalone-html")continue;
 const name=r.renderer.split(":")[0];
 if(["home","catalog","formatDirectory","genres","tags","search","library","history","following","tickets","omni","settings","account","authorStudio","trendFactory","formatLanding","chapters","novel","reader","authorPublic","authPage"].includes(name))assert.ok(client.includes(name),"client renderer missing: "+name+" at "+r.path);
}
for(const p of manifest.sitemaps)assert.ok(worker.includes(JSON.stringify(p)),"sitemap endpoint missing: "+p);
const noindex=worker.match(/const noindex=new Set\\(\\[([\\s\\S]*?)\\]\\)/);
assert.ok(noindex,"Worker noindex set not found");
for(const p of manifest.noindexExact)assert.ok(noindex[1].includes(JSON.stringify(p)),"Worker noindex policy missing: "+p);
console.log("Route registry validated: "+manifest.routes.length+" exact routes, "+manifest.patterns.length+" dynamic patterns, "+manifest.sitemaps.length+" sitemap endpoints.");
