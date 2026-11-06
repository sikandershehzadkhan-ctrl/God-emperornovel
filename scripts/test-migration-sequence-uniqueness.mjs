import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Normalize SQL formatting without changing quoted values or identifiers.
 * This is deliberately conservative: comments and whitespace outside quoted
 * tokens are ignored; all characters inside quoted tokens are preserved.
 */
function canonicalizeSql(source) {
  let result = '';
  let state = 'normal';
  let pendingSpace = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (state === 'line-comment') {
      if (char === '\n') {
        state = 'normal';
        pendingSpace = true;
      }
      continue;
    }

    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        state = 'normal';
        pendingSpace = true;
        i += 1;
      }
      continue;
    }

    if (state !== 'normal') {
      result += char;
      const closing = state === 'bracket' ? ']' : state;
      if (char === closing) {
        if (next === closing && state !== 'bracket') {
          result += next;
          i += 1;
        } else {
          state = 'normal';
        }
      }
      continue;
    }

    if (char === '-' && next === '-') {
      state = 'line-comment';
      pendingSpace = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      state = 'block-comment';
      pendingSpace = true;
      i += 1;
      continue;
    }
    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace && result && !result.endsWith(' ')) result += ' ';
    pendingSpace = false;

    if (char === "'") state = "'";
    else if (char === '"') state = '"';
    else if (char === '`') state = '`';
    else if (char === '[') state = 'bracket';

    result += char;
  }

  assert.notEqual(state, 'block-comment', 'Unterminated SQL block comment.');
  assert.ok(state === 'normal' || state === 'line-comment',
    'Unterminated SQL quoted token.');
  return result.trim();
}

// Guard the normalizer against false duplicate matches.
assert.equal(
  canonicalizeSql('SELECT  value FROM users; -- comment\n'),
  canonicalizeSql('SELECT value FROM users;'),
  'Whitespace and comments outside quoted tokens should be normalized.'
);
assert.notEqual(
  canonicalizeSql("INSERT INTO t VALUES ('a  b');"),
  canonicalizeSql("INSERT INTO t VALUES ('a b');"),
  'Whitespace inside string literals must remain significant.'
);
assert.notEqual(
  canonicalizeSql('SELECT "first  name" FROM users;'),
  canonicalizeSql('SELECT "first name" FROM users;'),
  'Whitespace inside quoted identifiers must remain significant.'
);
assert.notEqual(
  canonicalizeSql("SELECT 'it''s  fine';"),
  canonicalizeSql("SELECT 'it''s fine';"),
  'Escaped quote sequences must not terminate string-literal scanning.'
);

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

  const source = readFileSync(join(directory, file), 'utf8').replace(/^\uFEFF/, '');
  const sql = canonicalizeSql(source);
  assert.ok(sql.length > 0, `Migration must not be empty: ${file}`);

  const digest = createHash('sha256').update(sql).digest('hex');
  assert.ok(!contentOwners.has(digest),
    `Duplicate migration payload: ${contentOwners.get(digest)} and ${file}`);
  contentOwners.set(digest, file);
}

console.log(`Migration sequence guard passed: ${files.length} unique, non-empty migration files.`);
