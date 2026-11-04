import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('src/index.js', 'utf8');
const migration = fs.readFileSync('migrations/0001_initial.sql', 'utf8');
const start = worker.indexOf('const qs=[');
const end = worker.indexOf('];\n  for(const q of qs)', start);
assert.notEqual(start, -1, 'Runtime core schema statement list must exist');
assert.notEqual(end, -1, 'Runtime core schema statement list must have a stable boundary');
const runtime = worker.slice(start, end);

const required = [
  ['users', "role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','author','moderator','admin'))"],
  ['sessions', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['chapters', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['novel_genres', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['novel_genres', 'FOREIGN KEY(genre_id) REFERENCES genres(id) ON DELETE CASCADE'],
  ['novel_tags', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['novel_tags', 'FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE'],
  ['unlocks', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['unlocks', 'FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE'],
  ['unlock_batches', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['bookmarks', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['bookmarks', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['history', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['history', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['donations', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL'],
  ['comments', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'],
  ['comments', 'FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE'],
  ['novel_requests', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE']
];
for (const [table, fragment] of required) {
  const definition = runtime.match(new RegExp('CREATE TABLE IF NOT EXISTS '+table+' \\([^\\n]*'));
  assert.ok(definition, 'Runtime bootstrap must define '+table);
  assert.ok(definition[0].includes(fragment), table+' must include '+fragment);
  assert.ok(migration.includes(fragment), 'Canonical migration must include '+fragment);
}
assert.ok(!runtime.includes('role TEXT NOT NULL DEFAULT \'user\','), 'Runtime users role must not omit the role CHECK constraint');
assert.ok(!runtime.includes('unlock_batches (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,start_chapter INTEGER NOT NULL,end_chapter INTEGER NOT NULL,requested_count INTEGER NOT NULL,cost REAL NOT NULL DEFAULT 0'), 'Runtime unlock batch cost must match the migration definition');
console.log('Runtime schema constraint source checks passed.');
