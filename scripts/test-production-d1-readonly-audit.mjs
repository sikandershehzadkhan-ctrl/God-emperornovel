import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = 'docs/production/production-d1-read-only-audit.sql';
const source = readFileSync(path, 'utf8');

// Strip SQL comments before checking each executable statement.
const withoutComments = source
  .replace(/--[^\n]*/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const statements = withoutComments
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

assert.ok(statements.length >= 4, 'Expected the complete read-only audit query set.');
for (const [index, statement] of statements.entries()) {
  assert.match(
    statement,
    /^SELECT\b/i,
    `Audit statement ${index + 1} must be a SELECT query only.`
  );
  assert.doesNotMatch(
    statement,
    /\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|ATTACH|DETACH|VACUUM|REINDEX|BEGIN|COMMIT|ROLLBACK)\b/i,
    `Audit statement ${index + 1} contains a forbidden mutation/control keyword.`
  );
}

console.log(`PASS: ${statements.length} production D1 audit statements are SELECT-only.`);
