import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const matrix=JSON.parse(fs.readFileSync(path.join(root,"docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json"),"utf8"));
const source=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
assert.equal(matrix.schemaVersion,1,"unsupported API matrix schema");
assert.equal(matrix.exactRouteCount,matrix.exactRoutes.length,"exact route count mismatch");
assert.equal(matrix.dynamicRouteCount,matrix.dynamicRoutes.length,"dynamic route count mismatch");
assert.ok(matrix.exactRoutes.length>=70,"API exact route inventory unexpectedly small");
assert.ok(matrix.dynamicRoutes.length>=10,"API dynamic route inventory unexpectedly small");
const paths=matrix.exactRoutes.map(x=>x.path);
assert.equal(new Set(paths).size,paths.length,"duplicate API exact route");
for(const route of matrix.exactRoutes){
 assert.ok((source.includes(JSON.stringify(route.path))||source.includes("'"+route.path+"'")),"Worker source missing exact API path: "+route.path);
 assert.ok(Array.isArray(route.methods)&&Array.isArray(route.sourceLines),"API route metadata incomplete: "+route.path);
 if(route.methodGuardMissing)assert.ok(route.unguardedLines.length>0||route.methods.length===0,"method gap lacks evidence: "+route.path);
}
for(const route of matrix.dynamicRoutes){
 assert.ok(route.pathPattern.includes("api"),"non-API dynamic route included: "+route.pathPattern);
 assert.ok(Array.isArray(route.methods)&&Array.isArray(route.sourceLines),"dynamic API route metadata incomplete: "+route.pathPattern);
 if(route.pathPattern.startsWith("/^")){
  const inner=route.pathPattern.slice(1,route.pathPattern.lastIndexOf("/"));
  assert.ok(source.includes(inner),"Worker dynamic route regex missing: "+route.pathPattern);
 }
}
console.log("API route matrix validated: "+matrix.exactRoutes.length+" exact routes, "+matrix.dynamicRoutes.length+" dynamic patterns.");
