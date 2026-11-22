import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = 'migrations';
const files = readdirSync(directory)
  .filter(name => /^\\d{4}_[a-z0-9_-]+\\.sql$/i.test(name))
  .sort((a, b) => a.localeCompare(b, 'en'));

assert.ok(files.length > 0, 'No canonical SQL migrations were found.');
const seenNumbers = new Set();
const seenDigests = new Map();
const entries = files.map(file => {
  const match = /^(\\d{4})_/.exec(file);
  assert.ok(match, 'Migration filename is not canonical: ' + file);
  assert.ok(!seenNumbers.has(match[1]), 'Duplicate migration number: ' + match[1]);
  seenNumbers.add(match[1]);
  const bytes = readFileSync(join(directory, file));
  assert.ok(bytes.length > 0, 'Empty migration file: ' + file);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.ok(!seenDigests.has(sha256),
    'Duplicate exact migration payload: ' + seenDigests.get(sha256) + ' and ' + file);
  seenDigests.set(sha256, file);
  return { file: 'migrations/' + file, bytes: bytes.length, sha256 };
});

const manifest = {
  format: 'imperial-novel-canonical-migration-checksums/v1',
  algorithm: 'sha256',
  scope: 'exact raw file bytes; no whitespace or comment normalization',
  count: entries.length,
  migrations: entries
};
if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(manifest, null, 2) + '\\n');
} else {
  console.log('PASS: ' + entries.length + ' canonical migrations have unique sequence numbers and exact SHA-256 checksums.');
  console.log('Checksum format: raw file bytes, SHA-256; use --json to export the complete manifest.');
}
