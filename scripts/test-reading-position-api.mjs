import fs from 'node:fs';
const schema=fs.readFileSync('src/runtime-feature-schema.mjs','utf8');
const worker=fs.readFileSync('src/index.js','utf8');
const migrations=fs.readdirSync('migrations');
const checks={
 'runtime schema is versioned forward to v2':schema.includes('runtime_feature_schema_version')&&schema.includes("VALUES('runtime_feature_schema_version','2')"),
 'reading positions are unique per user and novel':schema.includes('PRIMARY KEY(user_id,novel_id)'),
 'canonical reading position uses percent plus optimistic revision, not the branch-local progress_percent column':schema.includes('percent REAL NOT NULL')&&schema.includes('revision INTEGER NOT NULL')&&!schema.includes('progress_percent'),
 'no competing numbered reading_positions migration exists':!migrations.some(name=>name.endsWith('_reading_positions.sql')&&name.slice(0,4).split('').every(char=>char>='0'&&char<='9')),
 'reading positions validate chapter and percentage bounds':schema.includes('CHECK(chapter_number > 0)')&&schema.includes('CHECK(percent >= 0 AND percent <= 100)'),
 'reading positions cascade only with their owning account and novel':schema.includes('FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE')&&schema.includes('FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'),
 'GET is scoped to the authenticated user':worker.includes('WHERE rp.user_id=? AND rp.novel_id=?'),
 'writes require a published novel and chapter':worker.includes("c.publication_status='published' AND n.publication_status='published'"),
 'writes reject invalid IDs, percentages and revisions':worker.includes('!Number.isSafeInteger(expected)||expected<0'),
 'optimistic concurrency rejects stale revisions':worker.includes('WHERE reading_positions.revision=? RETURNING')&&worker.includes('},409)'),
 'conflict response returns the latest user-owned position':worker.includes('WHERE user_id=? AND novel_id=?').includes ? true : worker.includes('FROM reading_positions WHERE user_id=? AND novel_id=?')
};
for(const [label,ok] of Object.entries(checks))console.log((ok?'PASS: ':'FAIL: ')+label);
if(Object.values(checks).some(ok=>!ok))process.exit(1);
