import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('src/index.js','utf8');
const migration=fs.readFileSync('migrations/0012_atomic_ai_run_claims.sql','utf8');
const start=worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/run$/.test(p)&&m==="POST"){');
const end=worker.indexOf('if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)&&m==="GET"){',start);
assert.notEqual(start,-1,'AI project run route must exist');
assert.notEqual(end,-1,'AI project jobs route must follow the run route');
const route=worker.slice(start,end);
for(const fragment of [
  'SET status=\'running\',active_run_token=?,active_run_started_at=CURRENT_TIMESTAMP',
  'status!=\'running\'',
  "active_run_started_at<=datetime('now','-30 minutes')",
  'run_token)',
  'WHERE id=? AND active_run_token=?',
  'Run claim expired or was replaced before completion',
  "status='superseded'"
]) assert.ok(route.includes(fragment),'Atomic AI run route missing '+fragment);
assert.ok(worker.includes('active_run_token=NULL,active_run_started_at=NULL,active_run_owner_user_id=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?'), 'Project edits must invalidate an active claim');
assert.ok(migration.includes('ALTER TABLE ai_author_projects ADD COLUMN active_run_token TEXT'));
assert.ok(migration.includes('ALTER TABLE ai_author_projects ADD COLUMN active_run_started_at TEXT'));
assert.ok(migration.includes('ALTER TABLE ai_author_projects ADD COLUMN active_run_owner_user_id INTEGER'));
assert.ok(migration.includes('ALTER TABLE ai_chapter_jobs ADD COLUMN run_token TEXT'));
assert.ok(worker.includes('["active_run_token","TEXT"]'));
assert.ok(worker.includes('["active_run_started_at","TEXT"]'));
assert.ok(worker.includes('["active_run_owner_user_id","INTEGER"]'));
assert.ok(worker.includes('ALTER TABLE ai_author_projects ADD COLUMN "+name+" "+type'));
assert.ok(worker.includes('ALTER TABLE ai_chapter_jobs ADD COLUMN run_token TEXT'));
console.log('Atomic AI run-claim source and migration checks passed.');
