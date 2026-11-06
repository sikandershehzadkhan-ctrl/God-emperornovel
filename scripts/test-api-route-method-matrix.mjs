import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const matrix=JSON.parse(fs.readFileSync(path.join(root,"docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json"),"utf8"));
const worker=fs.readFileSync(path.join(root,"src/index.js"),"utf8");
const validMethods=new Set(["GET","HEAD","POST","PUT","PATCH","DELETE","OPTIONS"]);

assert.equal(matrix.schemaVersion,1,"unsupported API inventory schema");
assert.ok(Array.isArray(matrix.exactRoutes)&&Array.isArray(matrix.dynamicRoutes),"exact and dynamic route inventories are required");
assert.equal(matrix.exactRoutes.length,matrix.exactRouteCount,"exact route count metadata drift");
assert.equal(matrix.dynamicRoutes.length,matrix.dynamicRouteCount,"dynamic route count metadata drift");
assert.ok(matrix.exactRouteCount>=50,"API route inventory unexpectedly small");
assert.ok(matrix.dynamicRouteCount>=5,"dynamic API route inventory unexpectedly small");
assert.ok(matrix.scope.includes("not a complete permission"),"inventory must not overclaim authorization certification");

const exactPaths=new Set();
for(const route of matrix.exactRoutes){
  assert.ok(route.path.startsWith("/api/"),"API route must be under /api: "+route.path);
  assert.ok(!exactPaths.has(route.path),"duplicate exact API route: "+route.path);
  exactPaths.add(route.path);
  assert.ok(Array.isArray(route.methods),"methods must be an array: "+route.path);
  for(const method of route.methods)assert.ok(validMethods.has(method),"unsupported HTTP method "+method+" at "+route.path);
  assert.ok(Array.isArray(route.sourceLines)&&route.sourceLines.length>0,"source line evidence missing: "+route.path);
  assert.ok(route.sourceLines.every(line=>Number.isInteger(line)&&line>0),"invalid source line evidence: "+route.path);
  assert.equal(route.methodGuardMissing,route.unguardedLines.length>0,"method guard flag disagrees with unguarded line evidence: "+route.path);
  assert.ok(typeof route.authorization==="string"&&route.authorization.length>0,"authorization review status missing: "+route.path);
}
const dynamicPatterns=new Set();
for(const route of matrix.dynamicRoutes){
  assert.ok(route.pathPattern.startsWith("^/api/")||route.pathPattern.startsWith("/^"),"dynamic API route must be anchored under /api: "+route.pathPattern);
  assert.ok(!dynamicPatterns.has(route.pathPattern),"duplicate dynamic API route: "+route.pathPattern);
  dynamicPatterns.add(route.pathPattern);
  if(route.pathPattern.startsWith("/^")){
    const patternSource=route.pathPattern.slice(1,route.pathPattern.lastIndexOf("/"));
    assert.doesNotThrow(()=>new RegExp(patternSource),"dynamic route regex must compile: "+route.pathPattern);
  }else{
    const templateSource=route.pathPattern.replace(/\{[^}]+\}/g,"[^/]+");
    assert.doesNotThrow(()=>new RegExp(templateSource),"dynamic route template must compile: "+route.pathPattern);
  }
  assert.ok(Array.isArray(route.methods),"dynamic methods must be an array: "+route.pathPattern);
  for(const method of route.methods)assert.ok(validMethods.has(method),"unsupported dynamic HTTP method "+method);
  assert.ok(Array.isArray(route.sourceLines)&&route.sourceLines.length>0,"dynamic source line evidence missing");
  assert.ok(typeof route.methodGuardMissing==="boolean","dynamic guard status must be explicit");
  assert.ok(typeof route.authorization==="string"&&route.authorization.length>0,"dynamic authorization review status missing");
}
assert.ok(worker.includes("async function api("),"Worker API dispatcher could not be located");
assert.ok(typeof matrix.sourceBlob==="string"&&matrix.sourceBlob.length>=40,"source blob metadata is required");

const sourceFiles = {
  "src/features/creator-studio/index.mjs": fs.readFileSync(path.join(root,"src/features/creator-studio/index.mjs"),"utf8"),
  "src/features/publishing-studio/index.mjs": fs.readFileSync(path.join(root,"src/features/publishing-studio/index.mjs"),"utf8")
};
const gitBlob = source => crypto.createHash("sha1").update(`blob ${Buffer.byteLength(source)}\0`).update(source).digest("hex");
assert.equal(matrix.sourceBlob,gitBlob(worker),"route inventory Worker source fingerprint is stale");
for(const [file,source] of Object.entries(sourceFiles)){
  assert.equal(matrix.featureSourceBlobs?.[file],gitBlob(source),"route inventory feature source fingerprint is stale: "+file);
}
for(const route of [...matrix.exactRoutes,...matrix.dynamicRoutes]){
  if(!route.sourceFile)continue;
  const source=sourceFiles[route.sourceFile];
  assert.ok(source,"route source file is not registered: "+route.sourceFile);

  if(route.routeMatchLine){
    const matchLine=source.split("\\n")[route.routeMatchLine-1]||"";
    assert.ok(matchLine.includes("p.match")&&matchLine.includes("author"),"dynamic route match evidence must identify its route in "+route.sourceFile);
  }
  for(const lineNumber of route.sourceLines){
    const line=source.split("\n")[lineNumber-1]||"";
    assert.ok(line.includes("m==="),"domain route evidence line must include a method guard: "+route.path||route.pathPattern);
    assert.ok(route.methods.some(method=>line.includes(method)),"domain route evidence method mismatch: "+(route.path||route.pathPattern));
  }
}
const expectedCreatorPaths=[
  "/api/author/analytics","/api/author/feedback","/api/author/goals",
  "/api/author/notes","/api/author/planning","/api/author/readiness"
];
for(const routePath of expectedCreatorPaths){
  assert.ok(matrix.exactRoutes.some(route=>route.path===routePath),"Creator route missing from inventory: "+routePath);
}
assert.ok(matrix.exactRoutes.some(route=>route.path==="/api/author/schedules"&&route.sourceFile==="src/features/publishing-studio/index.mjs"),"Publishing release calendar route missing or assigned to the wrong domain");
assert.ok(matrix.dynamicRoutes.some(route=>route.pathPattern.includes("notes")&&route.methods.includes("PATCH")&&route.methods.includes("DELETE")),"private note mutation routes missing from dynamic inventory");
assert.ok(matrix.dynamicRoutes.some(route=>route.pathPattern.includes("revisions")&&route.methods.includes("GET")),"chapter revision route missing from dynamic inventory");
assert.ok(matrix.dynamicRoutes.some(route=>route.pathPattern.includes("schedule")&&route.methods.includes("POST")),"chapter scheduling route missing from dynamic inventory");

console.log("API method inventory validated: "+matrix.exactRoutes.length+" exact endpoints, "+matrix.dynamicRoutes.length+" dynamic endpoints. Authorization remains a separate handler-level review.");
