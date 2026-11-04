import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const path="docs/architecture/IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json";
const data=JSON.parse(fs.readFileSync(path,"utf8"));
assert.equal(data.schemaVersion,1);
assert.equal(typeof data.sourceBranch,"string");
assert.ok(data.sourceBranch.length>0,"source branch provenance missing");
assert.match(data.sourceBlob,/^[a-f0-9]{40}$/);
const source=fs.readFileSync("src/index.js","utf8");
const gitBlob=crypto.createHash("sha1").update(`blob ${Buffer.byteLength(source)}\\0`).update(source).digest("hex");
assert.equal(data.sourceBlob,gitBlob,"ownership matrix must identify the exact Worker source blob under review");
assert.equal(data.routes.length,data.reviewedRouteCount);
assert.ok(data.reviewedRouteCount>=15);
assert.ok(data.pendingDisclosure.length>20);
const seen=new Set();
for(const route of data.routes){
 for(const key of ["path","method","access","ownerRule","evidence","tests"]) assert.ok(Object.hasOwn(route,key),route.path+": missing "+key);
 assert.ok(route.evidence.length>=20,route.path+": evidence missing");
 assert.ok(Array.isArray(route.tests)&&route.tests.length>0,route.path+": tests missing");
 const key=route.path+" "+route.method; assert.ok(!seen.has(key),"duplicate "+key); seen.add(key);
}
assert.ok(data.findings.length>=4);
console.log("Authorization/ownership matrix valid: "+data.routes.length+" reviewed route-method entries; "+data.findings.length+" findings; remaining routes explicitly pending.");
