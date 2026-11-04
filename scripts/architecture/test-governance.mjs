import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const ownership=read('docs/architecture/IMPERIAL-FEATURE-OWNERSHIP.json');
const graph=read('docs/architecture/IMPERIAL-DOMAIN-DEPENDENCIES.json');
const migrations=read('docs/architecture/IMPERIAL-MIGRATION-ALLOCATIONS.json');
const fail=(m)=>{throw new Error('[architecture-governance] '+m)};
const domains=new Map(ownership.domains.map(d=>[d.id,d]));
assert.equal(domains.size,ownership.domains.length,'duplicate domain id');
const roots=[];
for(const d of ownership.domains)for(const p of d.owns)roots.push({path:p,owner:d.id});
for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++){
 const a=roots[i],b=roots[j];
 if(a.path===b.path)fail('duplicate path owner: '+a.path+' ('+a.owner+', '+b.owner+')');
}
for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++){
 const a=roots[i],b=roots[j];
 if(a.path.endsWith('/')&&b.path.startsWith(a.path)||b.path.endsWith('/')&&a.path.startsWith(b.path))fail('overlapping ownership roots are forbidden: '+a.path+' ('+a.owner+') and '+b.path+' ('+b.owner+')');
}
// Full repository invariant: every tracked file has exactly one canonical owner.
// This catches untouched orphan files too, not merely paths changed by the current PR.
const trackedPaths=execFileSync('git',['ls-files'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
for(const file of trackedPaths){
 const owners=roots.filter(r=>file===r.path||file.startsWith(r.path.endsWith('/')?r.path:r.path+'/'));
 if(owners.length===0)fail('tracked path has no registered owner: '+file+'; assign a domain before merging');
 if(owners.length>1)fail('tracked path has multiple owners: '+file+' ('+owners.map(r=>r.owner).join(', ')+')');
}
console.log('Full tracked-path ownership checked: '+trackedPaths.length+' files; exactly one owner each.');
for(const sharedPath of ownership.sharedPaths||[]){
 const candidate=sharedPath.endsWith('*')?sharedPath.slice(0,-1):sharedPath;
 const owner=roots.find(r=>candidate===r.path||candidate.startsWith(r.path.endsWith('/')?r.path:r.path+'/'));
 if(!owner)fail('shared path has no canonical owner: '+sharedPath);
}
for(const [id,node] of Object.entries(graph.domains)){
 if(!domains.has(id))fail('dependency node has no owner: '+id);
 for(const dep of node.dependsOn){if(!graph.domains[dep])fail(id+' depends on unknown domain '+dep);if(dep==='experience-shell'&&id!=='experience-shell')fail(id+' must not depend on the experience shell');}
}
for(const id of domains.keys())if(!graph.domains[id])fail('owned domain missing dependency node: '+id);
const visiting=new Set(),visited=new Set();
function visit(id,trail=[]){if(visiting.has(id))fail('dependency cycle: '+[...trail,id].join(' -> '));if(visited.has(id))return;visiting.add(id);for(const d of graph.domains[id].dependsOn)visit(d,[...trail,id]);visiting.delete(id);visited.add(id);}
for(const id of Object.keys(graph.domains))visit(id);
for(const [id,node] of Object.entries(graph.domains)){
 if(node.layer>0)for(const dep of node.dependsOn){if(graph.domains[dep].layer>=node.layer)fail('layer inversion: '+id+' (layer '+node.layer+') depends on '+dep+' (layer '+graph.domains[dep].layer+')');}
}
const files=fs.readdirSync('migrations').filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort();
const nums=files.map(f=>Number(f.slice(0,4)));
if(new Set(nums).size!==nums.length)fail('duplicate migration sequence number');
for(let i=1;i<nums.length;i++)if(nums[i]!==nums[i-1]+1)fail('migration sequence gap between '+nums[i-1]+' and '+nums[i]);
for(const n of nums){const ranges=migrations.ranges.filter(r=>n>=r.from&&n<=r.to);if(ranges.length!==1)fail('migration '+n+' must have exactly one owning allocation range');}
for(const r of migrations.ranges){if(!domains.has(r.owner))fail('migration range has unknown owner '+r.owner);}
const orderedRanges=migrations.ranges.slice().sort((a,b)=>a.from-b.from);
if(!orderedRanges.length||orderedRanges[0].from!==1)fail('migration allocations must start at sequence 0001');
for(let i=0;i<orderedRanges.length;i++){
 const r=orderedRanges[i];
 if(!Number.isInteger(r.from)||!Number.isInteger(r.to)||r.from>r.to)fail('invalid migration allocation range '+JSON.stringify(r));
 if(i&&r.from!==orderedRanges[i-1].to+1)fail('migration allocation ranges overlap or contain a gap between '+orderedRanges[i-1].to+' and '+r.from);
}
if(orderedRanges.at(-1).to!==migrations.lastObservedSequence)fail('lastObservedSequence must equal the final allocated migration number');
if(nums.at(-1)!==migrations.lastObservedSequence)fail('lastObservedSequence does not match the actual migration directory');
const routePath='docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json';
if(fs.existsSync(routePath)){const reg=read(routePath);const seen=new Set();for(const r of reg.routes||[]){if(seen.has(r.path))fail('duplicate route registry path '+r.path);seen.add(r.path);}}
const apiPath='docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json';
if(fs.existsSync(apiPath)){const reg=read(apiPath);const seen=new Set();for(const r of reg.exactRoutes||[]){const key=r.path+' '+(r.methods||[]).slice().sort().join(',');if(seen.has(key))fail('duplicate API route-method declaration '+key);seen.add(key);}}
const workerBytes=fs.readFileSync('src/index.js');
const workerBlob=createHash('sha1').update('blob '+workerBytes.length+'\0').update(workerBytes).digest('hex');
for(const p of [apiPath,'docs/architecture/IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json']){
 if(fs.existsSync(p)){const reg=read(p);if(reg.sourceBlob!==workerBlob)fail(p+' is stale: sourceBlob '+reg.sourceBlob+' does not match Worker blob '+workerBlob+'; regenerate its evidence from this exact source snapshot');}
}
const changedBase=process.env.ARCH_BASE_SHA;
if(changedBase){
 let changed=[];try{changed=execFileSync('git',['diff','--name-only',changedBase,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);}catch(e){fail('unable to inspect PR changed paths: '+e.message);}
 const shared=ownership.sharedPaths||[];
 const adrDir=ownership.rules.adrDirectory;
 const hasAdr=changed.some(p=>p.startsWith(adrDir)&&p.endsWith('.md'));
 const hasFeatureContract=changed.some(p=>p.startsWith('docs/architecture/feature-contracts/')&&p.endsWith('.json'));
 const hasFeatureCode=changed.some(p=>p.startsWith('src/')||p.startsWith('public/')||p.startsWith('migrations/'));
 const migrationDiff=execFileSync('git',['diff','--name-status',changedBase,'HEAD','--','migrations'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const baseMigrationFiles=execFileSync('git',['ls-tree','-r','--name-only',changedBase,'migrations'],{encoding:'utf8'}).split('\n').filter(p=>/^migrations\/\d{4}_.*\.sql$/.test(p));
 const baseMigrationMax=baseMigrationFiles.reduce((m,p)=>Math.max(m,Number(p.slice(11,15))),0);
 for(const line of migrationDiff){const [status,file]=line.split('\t');if(status!=='A')fail('shared migration history is immutable; only new forward migrations may be added: '+line);const n=Number(file.slice(11,15));if(n<=baseMigrationMax)fail('new migration must use a newly allocated number above '+baseMigrationMax+': '+file);}
 if(hasFeatureCode&&!hasFeatureContract)fail('feature code/schema changes require a feature contract in docs/architecture/feature-contracts/');
 for(const file of changed.filter(p=>p.startsWith('docs/architecture/feature-contracts/')&&p.endsWith('.json'))){
  const contract=read(file);
  if(!contract.featureId||!contract.domainOwner||!domains.has(contract.domainOwner))fail('feature contract has missing/unknown featureId or domainOwner: '+file);
  if(!contract.technicalIntegrator)fail('feature contract must name a technicalIntegrator: '+file);
  if(!Array.isArray(contract.affectedDomains)||contract.affectedDomains.length===0||contract.affectedDomains.some(id=>!domains.has(id)))fail('feature contract must list valid affectedDomains: '+file);
  for(const field of ['dependencies','tests','migrationPlan','privacySecurity','rollout','rollback'])if(contract[field]===undefined)fail('feature contract is missing '+field+': '+file);
  if(!Array.isArray(contract.ownedPaths)||contract.ownedPaths.length===0)fail('feature contract must declare ownedPaths: '+file);
  for(const ownedPath of contract.ownedPaths){const owner=roots.find(r=>ownedPath===r.path||ownedPath.startsWith(r.path.endsWith('/')?r.path:r.path+'/'));if(!owner||owner.owner!==contract.domainOwner)fail('feature contract path '+ownedPath+' is not owned by declared domain '+contract.domainOwner+' in '+file);}
 }
 const rootsSorted=roots.slice().sort((a,b)=>b.path.length-a.path.length);
 for(const file of changed){
  if(file===''||file==='.gitignore'||file==='.gitattributes')continue;
  const owner=rootsSorted.find(r=>file===r.path||file.startsWith(r.path.endsWith('/')?r.path:r.path+'/'));
  if(!owner)fail('changed path has no registered owner: '+file+'; register its domain before merging');
  const protectedPath=shared.some(p=>p.endsWith('*')?file.startsWith(p.slice(0,-1)):file===p||p.endsWith('/')&&file.startsWith(p));
  if(protectedPath&&!hasAdr)fail('shared path changed without an Architecture Decision Record in '+adrDir+': '+file);
 }
 console.log('PR path ownership checked: '+changed.length+' changed paths; shared-file ADR rule checked.');
}
console.log('PASS: architecture ownership, dependency DAG, migration allocation, route uniqueness and API declaration integrity.');
