import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const requiredFiles=[
 "docs/architecture/IMPERIAL-PLATFORM-ROOT.md",
 "docs/architecture/FEATURE-BOUNDARY-AND-INTEGRATION-POLICY.md",
 "docs/architecture/FEATURE-OWNERSHIP-MAP.json",
 "docs/architecture/FEATURE-CHANGE-CONTRACT.template.json",
 "docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json",
 "docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json",
 "docs/architecture/IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json",
 "docs/architecture/CANONICAL-MIGRATION-COLLISION-REGISTER.md"
];
for(const file of requiredFiles)assert.ok(fs.existsSync(file),"architecture root dependency missing: "+file);
const root=fs.readFileSync(requiredFiles[0],"utf8");
for(const section of ["## 1. Architecture tree","## 2. Canonical source-of-truth registry","## 3. Source layout policy","## 4. Integration lifecycle","## 5. Non-negotiable invariants","## 6. Change control"])assert.ok(root.includes(section),"architecture root section missing: "+section);
const policy=fs.readFileSync(requiredFiles[1],"utf8");
for(const phrase of ["Collision scan protocol","Database rules","API and data rules","Frontend and rendering rules","Pull request and merge rules","Future feature acceptance checklist"])assert.ok(policy.includes(phrase),"governance policy missing: "+phrase);
const ownership=JSON.parse(fs.readFileSync(requiredFiles[2],"utf8"));
assert.equal(ownership.schemaVersion,1);
assert.ok(Array.isArray(ownership.domains)&&ownership.domains.length>=8);
assert.ok(Array.isArray(ownership.sharedSurfaces)&&ownership.sharedSurfaces.length>=5);
const ids=new Set();
const ownedPaths=new Map();
for(const domain of ownership.domains){
 assert.ok(domain.id&&domain.owner&&Array.isArray(domain.paths)&&domain.paths.length,"incomplete domain ownership record");
 assert.ok(!ids.has(domain.id),"duplicate domain ID: "+domain.id);ids.add(domain.id);
 for(const p of domain.paths){
  assert.ok(p.endsWith("/"),"owned directory must end in slash: "+p);
  const prior=ownedPaths.get(p);
  assert.ok(!prior,"path has multiple owners: "+p+" ("+prior+" and "+domain.id+")");
  ownedPaths.set(p,domain.id);
 }
}
const template=JSON.parse(fs.readFileSync(requiredFiles[3],"utf8"));
for(const field of ownership.requiredContractFields)assert.ok(Object.hasOwn(template,field),"feature contract template missing "+field);
const route=JSON.parse(fs.readFileSync(requiredFiles[4],"utf8"));
const api=JSON.parse(fs.readFileSync(requiredFiles[5],"utf8"));
const auth=JSON.parse(fs.readFileSync(requiredFiles[6],"utf8"));
assert.ok(route.routes.length>=30&&route.patterns.length>=5,"route registry unexpectedly incomplete");
assert.ok(api.exactRouteCount>=1&&api.dynamicRouteCount>=1,"API method inventory unexpectedly incomplete");
assert.equal(auth.routes.length,auth.reviewedRouteCount,"authorization review count drift");
const packageJson=JSON.parse(fs.readFileSync("package.json","utf8"));
assert.ok(packageJson.scripts.build.includes("test-platform-architecture-contract.mjs"),"architecture contract test must be part of build");
const migrationDir="migrations";
if(fs.existsSync(migrationDir)){
 const names=fs.readdirSync(migrationDir).filter(x=>/^\d{4}_.*\.sql$/.test(x)).sort();
 const numberOwners=new Map();
 for(const name of names){
  const number=name.slice(0,4);
  assert.ok(!numberOwners.has(number),"duplicate migration number "+number+": "+numberOwners.get(number)+" and "+name);
  numberOwners.set(number,name);
 }
 assert.ok(names.length>0,"no canonical SQL migrations found");
}
const contractDir="docs/architecture/feature-contracts";
if(fs.existsSync(contractDir)){
 for(const name of fs.readdirSync(contractDir).filter(x=>x.endsWith(".json"))){
  const contract=JSON.parse(fs.readFileSync(path.join(contractDir,name),"utf8"));
  assert.equal(name,contract.featureId+".json","feature contract filename must match featureId");
  assert.ok(ownership.domains.some(d=>d.id===contract.domainOwner||d.owner===contract.domainOwner),"feature contract has no registered domain owner: "+contract.domainOwner);
  for(const field of ownership.requiredContractFields)assert.ok(Object.hasOwn(contract,field),"feature contract "+name+" missing "+field);
 }
}

// Pull-request change-impact enforcement. Full git history is required in CI.
if(process.env.GITHUB_EVENT_PATH&&fs.existsSync(process.env.GITHUB_EVENT_PATH)){
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,"utf8"));
 const pr=event.pull_request;
 if(pr?.base?.sha&&pr?.head?.sha){
  const {execFileSync}=await import("node:child_process");
  const changed=execFileSync("git",["diff","--name-only",pr.base.sha+"..."+pr.head.sha],{encoding:"utf8"}).split(/\r?\n/).filter(Boolean);
  const shared=/^(src\/index\.js|public\/app(?:-[^/]+)?\.js|public\/index\.html|public\/app(?:-[^/]+)?\.css|migrations\/.+|wrangler\.toml|package\.json)$/;
  if(changed.some(p=>shared.test(p))){
   const contractPath="docs/architecture/feature-contracts/platform-integration-governance.json";
   assert.ok(changed.includes(contractPath),"shared platform surfaces changed without updating "+contractPath);
  }
  const featureIds=new Set();
  for(const file of changed){const match=file.match(/^(?:src|public)\/features\/([^/]+)\//);if(match)featureIds.add(match[1]);}
  for(const id of featureIds){
   const contractPath="docs/architecture/feature-contracts/"+id+".json";
   assert.ok(changed.includes(contractPath),"feature module requires its own contract in this PR: "+contractPath);
  }
 }
}

console.log("Platform architecture contract passed: "+ownership.domains.length+" domains, "+ownership.sharedSurfaces.length+" shared surfaces, "+route.routes.length+" routes, "+api.exactRouteCount+" API routes, "+namesCount()+" numbered migrations.");
function namesCount(){return fs.existsSync(migrationDir)?fs.readdirSync(migrationDir).filter(x=>/^\d{4}_.*\.sql$/.test(x)).length:0}
