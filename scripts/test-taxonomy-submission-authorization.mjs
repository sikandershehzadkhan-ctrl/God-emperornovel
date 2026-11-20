import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const start = source.indexOf('async function communityTaxonomy(req,env,principal){');
assert.notEqual(start, -1, 'taxonomy handler must receive the authenticated principal');

const end = source.indexOf('\nasync function seed(', start);
assert.notEqual(end, -1, 'taxonomy handler boundary must remain discoverable');
const handler = source.slice(start, end);
const post = handler.slice(handler.indexOf("if(method==='POST'){"));

assert.match(source, /if\(p===["']\/api\/taxonomy["']\)return communityTaxonomy\(req,env,u\);/,
  'dispatcher must pass the authenticated principal');
assert.match(handler, /if\(method==='GET'\)[\s\S]*?if\(method==='POST'\)/,
  'approved taxonomy GET must remain separate from the protected POST');
assert.match(post, /const e=need\(u\);if\(e\)return e;/,
  'taxonomy submissions must require an authenticated account');
assert.match(post, /consumeAuthRateLimit\(env,'taxonomy-user',String\(principal\\.id\),5,86400\)/,
  'taxonomy submissions must be rate limited per authenticated user');
assert.match(post, /principal\\.id,String\(principal\\.username\|\|'\'\)\.slice\(0,80\)/,
  'submitter identity must come from the authenticated principal');
assert.doesNotMatch(post, /b\.creator_id|b\.creator_name/,
  'request body must never control submitter identity');

console.log('Taxonomy submission authorization and attribution regression checks passed.');
