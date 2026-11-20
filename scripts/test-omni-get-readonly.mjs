import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const lineFor = marker => {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'expected route marker: ' + marker);
  const end = source.indexOf('\n', start);
  return source.slice(start, end < 0 ? source.length : end);
};

const publicStatus = lineFor('if(p==="/api/omni/status"&&m==="GET"){');
assert.doesNotMatch(publicStatus, /seedOmni|ensureOmniTables/,
  'public OmniPortal status GET must not seed records or perform schema setup');

const publicSearch = lineFor('if(p==="/api/omni/search"&&m==="GET"){');
assert.doesNotMatch(publicSearch, /ensureOmniTables/,
  'public OmniPortal search GET must not perform schema setup');

const userJobs = lineFor('if(p==="/api/omni/jobs"&&m==="GET"){');
assert.match(userJobs, /need\(u\)/, 'private import-job reads must remain authenticated');
assert.doesNotMatch(userJobs, /ensureOmniTables/,
  'import-job GET must not perform schema setup');

const recommendations = lineFor('if(p==="/api/recommendations"&&m==="GET"){');
assert.match(recommendations, /need\(u\)/, 'recommendation reads must remain authenticated');
assert.doesNotMatch(recommendations, /ensureOmniTables/,
  'recommendation GET must not perform schema setup');

const adminConnectors = lineFor('if(p==="/api/admin/connectors"&&m==="GET"){');
assert.match(adminConnectors, /admin\(u\)/, 'connector initialization must remain admin-only');
assert.match(adminConnectors, /seedOmni\(env\)/,
  'connector registry initialization must run from the protected admin route');

console.log('OmniPortal GET side-effect and admin initialization regression checks passed.');
