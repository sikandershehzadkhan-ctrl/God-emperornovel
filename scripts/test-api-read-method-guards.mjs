import assert from 'node:assert/strict';
import fs from 'node:fs';
const worker=fs.readFileSync('src/index.js','utf8');
const readOnlyRoutes=["/api/me","/api/config","/api/genres","/api/tags","/api/public-authors","/api/sources","/api/omni/status","/api/omni/search","/api/omni/resolve","/api/omni/smart-unlock","/api/novels","/api/admin/stats"];
for(const path of readOnlyRoutes){
 const guard='if(p==="'+path+'"&&m!=="GET")return json({error:"Method not allowed"},405);';
 assert.ok(worker.includes(guard),'Read-only API route must reject non-GET methods: '+path);
}
assert.ok(worker.includes('if(p==="/api/health"&&m==="GET"'), 'Health fast path remains GET-only');
assert.ok(worker.includes('if(p==="/api/health")return json({error:"Method not allowed"},405);'), 'Health rejects non-GET methods before schema work');
assert.ok(worker.includes("return json({error:'Method not allowed'},405);"), 'Taxonomy helper rejects unsupported methods');
console.log('Read-only API method guards passed: '+readOnlyRoutes.length+' routes plus health and taxonomy.');
