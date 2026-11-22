import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const guards = [
  'if(p==="/api/omni/status"&&m!=="GET")return json({error:"Method not allowed"},405,{Allow:"GET"})',
  'if(p==="/api/omni/search"&&m!=="GET")return json({error:"Method not allowed"},405,{Allow:"GET"})',
  'if(p==="/api/omni/jobs"&&m!=="GET")return json({error:"Method not allowed"},405,{Allow:"GET"})',
  'if(p==="/api/recommendations"&&m!=="GET")return json({error:"Method not allowed"},405,{Allow:"GET"})'
];

for (const guard of guards) assert.ok(source.includes(guard), 'missing method contract: ' + guard);
for (const path of ['/api/omni/status','/api/omni/search','/api/omni/jobs','/api/recommendations']) {
  assert.ok(source.includes('if(p==="' + path + '"&&m==="GET"){'), 'missing GET handler: ' + path);
}

console.log('OmniPortal GET-only method contract regression checks passed.');
