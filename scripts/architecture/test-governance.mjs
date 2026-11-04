import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
for(const [id,node] of Object.entries(graph.domains)){
 if(!domains.has(id))fail('dependency node has no owner: '+id);
 for(const dep of node.dependsOn){if(!graph.domains[dep])fail(id+' depends on unknown domain '+dep);if(dep==='experience-shell'&&id!=='experience-shell')fail(id+' must not depend on the experience shell');}
}
for(const id of domains.keys())if(!graph.domains[id])fail('owned domain missing dependency node: '+id);
const visiting=new Set(),visited=new Set();
function visit(id,trail=[]){if(visiting.has(id))fail('dependency cycle: '+[...trail,id].join(' -> '));if(visited.has(id))return;visiting.add(id);for(const d of graph.domains[id].dependsOn)visit(d,[...trail,id]);visiting.delete(id);visited.add(id);}
for(const id of Object.keys(graph.domains))visit(id);
const files=fs.readdirSync('migrations').filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort();
const nums=files.map(f=>Number(f.slice(0,4)));
if(new Set(nums).size!==nums.length)fail('duplicate migration sequence number');
for(let i=1;i<nums.length;i++)if(nums[i]!==nums[i-1]+1)fail('migration sequence gap between '+nums[i-1]+' and '+nums[i]);
for(const n of nums){const ranges=migrations.ranges.filter(r=>n>=r.from&&n<=r.to);if(ranges.length!==1)fail('migration '+n+' must have exactly one owning allocation range');}
for(const r of migrations.ranges){if(!domains.has(r.owner))fail('migration range has unknown owner '+r.owner);}
const routePath='docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json';
if(fs.existsSync(routePath)){const reg=read(routePath);const seen=new Set();for(const r of reg.routes||[]){if(seen.has(r.path))fail('duplicate route registry path '+r.path);seen.add(r.path);}}
const apiPath='docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json';
if(fs.existsSync(apiPath)){const reg=read(apiPath);const seen=new Set();for(const r of reg.exactRoutes||[]){const key=r.path+' '+(r.methods||[]).slice().sort().join(',');if(seen.has(key))fail('duplicate API route-method declaration '+key);seen.add(key);}}
const changedBase=process.env.ARCH_BASE_SHA;
if(changedBase){
 let changed=[];try{changed=execFileSync('git',['diff','--name-only',changedBase,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);}catch(e){fail('unable to inspect PR changed paths: '+e.message);}
 const shared=ownership.sharedPaths||[];
 const adrDir=ownership.rules.adrDirectory;
 const hasAdr=changed.some(p=>p.startsWith(adrDir)&&p.endsWith('.md'));
 const rootsSorted=roots.slice().sort((a,b)=>b.path.length-a.path.length);
 for(const file of changed){
  if(file===''||file==='.gitignore'||file==='.gitattributes')continue;
  const owner=rootsSorted.find(r=>file===r.path||file.startsWith(r.path.endsWith('/')?r.path:r.path+'/'));
  if(!owner)fail('changed path has no registered owner: '+file+'; register its domain before merging');
  const protectedPath=shared.some(p=>file===p||p.endsWith('/')&&file.startsWith(p));
  if(protectedPath&&!hasAdr)fail('shared path changed without an Architecture Decision Record in '+adrDir+': '+file);
 }
 console.log('PR path ownership checked: '+changed.length+' changed paths; shared-file ADR rule checked.');
}
console.log('PASS: architecture ownership, dependency DAG, migration allocation, route uniqueness and API declaration integrity.');
