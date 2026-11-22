import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';

function reconcile(manifest, evidence) {
  assert.equal(manifest?.format, 'imperial-novel-canonical-migration-checksums/v1',
    'Unsupported repository checksum manifest format.');
  assert.equal(manifest.algorithm, 'sha256');
  assert.ok(Array.isArray(manifest.migrations), 'Repository manifest has no migration list.');
  assert.ok(evidence && typeof evidence === 'object', 'Production evidence JSON is required.');
  assert.ok(typeof evidence.database === 'string' && evidence.database.trim(),
    'Production evidence must identify the audited database.');
  assert.ok(typeof evidence.auditedAt === 'string' && !Number.isNaN(Date.parse(evidence.auditedAt)),
    'Production evidence must include a valid audit timestamp.');
  assert.ok(typeof evidence.ledgerComplete === 'boolean',
    'Production evidence must explicitly state whether the applied migration ledger is complete.');
  assert.ok(Array.isArray(evidence.appliedMigrations),
    'Production evidence must include appliedMigrations, even when empty.');
  const source = new Map();
  for (const item of manifest.migrations) {
    assert.match(item.file, /^migrations\/\d{4}_[a-z0-9_-]+\.sql$/i);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isInteger(item.bytes) && item.bytes > 0);
    assert.ok(!source.has(item.file), 'Duplicate repository migration: ' + item.file);
    source.set(item.file, item);
  }
  const applied = new Map();
  for (const item of evidence.appliedMigrations) {
    assert.ok(item && typeof item.name === 'string' && item.name.trim(),
      'Every production ledger record must include its exact migration name.');
    assert.ok(!applied.has(item.name), 'Duplicate production ledger identity: ' + item.name);
    applied.set(item.name, item);
  }
  const rows = [...source.values()].map(item => {
    const name = item.file.slice('migrations/'.length);
    const ledger = applied.get(name);
    if (!ledger) return { migration: name, status: evidence.ledgerComplete ? 'missing' : 'unknown',
      reason: evidence.ledgerComplete ? 'Absent from an explicitly complete applied-migration ledger.' :
        'No matching ledger row, but production ledger completeness is not verified.' };
    if (typeof ledger.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(ledger.sha256)) {
      return { migration: name, status: 'unknown',
        reason: 'Production records the migration name but supplies no verifiable SHA-256 checksum.' };
    }
    if (ledger.sha256 !== item.sha256) return { migration: name, status: 'mismatch',
      reason: 'Production checksum differs from the repository exact-byte checksum.' };
    return { migration: name, status: 'verified',
      reason: 'Exact filename and SHA-256 match the production evidence.' };
  });
  for (const name of applied.keys()) {
    if (!source.has('migrations/' + name)) rows.push({
      migration: name, status: 'mismatch',
      reason: 'Production ledger contains a migration identity absent from this repository manifest.'
    });
  }
  const counts = Object.fromEntries(['verified','missing','mismatch','unknown'].map(status =>
    [status, rows.filter(row => row.status === status).length]));
  return {
    format: 'imperial-novel-production-migration-reconciliation/v1',
    database: evidence.database,
    auditedAt: evidence.auditedAt,
    repositoryManifestCount: source.size,
    ledgerComplete: evidence.ledgerComplete,
    counts,
    releaseReady: counts.missing === 0 && counts.mismatch === 0 && counts.unknown === 0,
    rows
  };
}

function selfTest() {
  const manifest = { format: 'imperial-novel-canonical-migration-checksums/v1', algorithm: 'sha256',
    migrations: [
      { file: 'migrations/0001_initial.sql', bytes: 10, sha256: 'a'.repeat(64) },
      { file: 'migrations/0002_accounts.sql', bytes: 20, sha256: 'b'.repeat(64) }
    ] };
  const base = { database: 'test-d1', auditedAt: '2026-11-22T00:00:00Z', ledgerComplete: true };
  let result = reconcile(manifest, { ...base, appliedMigrations: [
    { name: '0001_initial.sql', sha256: 'a'.repeat(64) }
  ] });
  assert.deepEqual(result.counts, { verified: 1, missing: 1, mismatch: 0, unknown: 0 });
  assert.equal(result.releaseReady, false);
  result = reconcile(manifest, { ...base, ledgerComplete: false, appliedMigrations: [] });
  assert.deepEqual(result.counts, { verified: 0, missing: 0, mismatch: 0, unknown: 2 });
  result = reconcile(manifest, { ...base, appliedMigrations: [
    { name: '0001_initial.sql', sha256: 'c'.repeat(64) },
    { name: '0002_accounts.sql', sha256: 'b'.repeat(64) }
  ] });
  assert.deepEqual(result.counts, { verified: 1, missing: 0, mismatch: 1, unknown: 0 });
  assert.equal(result.releaseReady, false);
  result = reconcile(manifest, { ...base, appliedMigrations: [
    { name: '0001_initial.sql' }, { name: '0002_accounts.sql', sha256: 'b'.repeat(64) }
  ] });
  assert.deepEqual(result.counts, { verified: 1, missing: 0, mismatch: 0, unknown: 1 });
  result = reconcile(manifest, { ...base, appliedMigrations: [
    { name: '0001_initial.sql', sha256: 'a'.repeat(64) },
    { name: '0002_accounts.sql', sha256: 'b'.repeat(64) },
    { name: '0099_untracked.sql', sha256: 'd'.repeat(64) }
  ] });
  assert.equal(result.counts.mismatch, 1);
  assert.throws(() => reconcile(manifest, { ...base, ledgerComplete: 'yes', appliedMigrations: [] }),
    /ledger completeness/);
  assert.throws(() => reconcile(manifest, { ...base, appliedMigrations: [
    { name: '0001_initial.sql' }, { name: '0001_initial.sql' }
  ] }), /Duplicate production ledger identity/);
}

if (process.argv.includes('--self-test')) {
  selfTest();
  console.log('PASS: migration reconciliation distinguishes verified, missing, mismatch and unknown without guessing.');
} else {
  const [manifestPath, evidencePath] = process.argv.slice(2);
  if (!manifestPath || !evidencePath) {
    console.error('Usage: node scripts/reconcile-production-migrations.mjs <repository-manifest.json> <production-evidence.json>');
    process.exit(2);
  }
  const result = reconcile(JSON.parse(fs.readFileSync(resolve(manifestPath), 'utf8')),
    JSON.parse(fs.readFileSync(resolve(evidencePath), 'utf8')));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.releaseReady) process.exitCode = 1;
}

export { reconcile };
