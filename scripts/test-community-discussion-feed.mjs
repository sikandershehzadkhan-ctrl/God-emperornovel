import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync('src/index.js', 'utf8');
const app = readFileSync('public/app.js', 'utf8');
const served = readFileSync('public/app-17.23.0.js', 'utf8');

assert.ok(worker.includes('if(p==="/api/community/discussions"&&m==="GET")'), 'community discussions API route must exist');
assert.ok(worker.includes("c.status='visible'"), 'feed must expose visible comments only');
assert.ok(worker.includes("n.publication_status='published'"), 'feed must exclude unpublished novels');
assert.ok(worker.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"), 'feed must exclude novels without eligible rights status');
assert.ok(worker.includes('ORDER BY c.created_at DESC,c.id DESC'), 'feed must have deterministic newest-first ordering');
assert.ok(worker.includes('LIMIT 12'), 'feed must be bounded');
assert.ok(!worker.slice(worker.indexOf('if(p==="/api/community/discussions"'), worker.indexOf('if(p==="/api/leaderboard"')).includes('chapter.body'), 'feed must not return chapter content');

assert.ok(app.includes('id="communityDiscussions"'), 'community page must render the discussions region');
assert.ok(app.includes("api('/api/community/discussions')"), 'community page must load the discussions feed');
assert.ok(app.includes('#community'), 'discussion items must link to the novel community section');
assert.ok(app.includes('esc(String(x.body||\'\').slice(0,220))'), 'comment excerpts must be escaped and length-bounded');
assert.equal(app, served, 'source and versioned browser bundles must remain identical');

console.log('Community recent-discussions feed regression checks passed.');
