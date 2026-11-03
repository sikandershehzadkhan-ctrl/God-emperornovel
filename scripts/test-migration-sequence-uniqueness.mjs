import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = 'migrations';
const files = readdirSync(directory)
  .filter((name) => /^\d{4}_[a-z0-9_-]+\.sql$/i.test(name))
  .sort((a, b) => a.localeCompare(b, 'en'));

assert.ok(files.length > 0, 'Expected a numbered SQL migration directory.');

const numberOwners = new Map();
const contentOwners = new Map();

for (const file of files) {
  const match = file.match(/^(\d{4})_/);
  assert.ok(match, `Migration filename must start with a four-digit sequence: ${file}`);

  const sequence = match[1];
  assert.ok(!numberOwners.has(sequence),
    `Duplicate migration sequence ${sequence}: ${numberOwners.get(sequence)} and ${file}`);
  numberOwners.set(sequence, file);

  // Normalize comments and formatting while preserving token order and literal case.
  // This catches equivalent SQL copied under another sequence with different indentation.
  const sql = readFileSync(join(directory, file), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
  assert.ok(sql.length > 0, `Migration must not be empty: ${file}`);

  const digest = createHash('sha256').update(sql).digest('hex');
  assert.ok(!contentOwners.has(digest),
    `Duplicate migration payload: ${contentOwners.get(digest)} and ${file}`);
  contentOwners.set(digest, file);
}

console.log(`Migration sequence guard passed: ${files.length} unique, non-empty migration files.`);
