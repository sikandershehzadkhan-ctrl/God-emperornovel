import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const fail = message => { throw new Error('[governance:ownership] ' + message); };
export function validateOwnership(registry, changedPaths = [], trackedPaths = []) {
  if (registry.version !== 1 || !Array.isArray(registry.owners)) fail('unsupported or malformed ownership registry');
  const roots = [];
  const ids = new Set();
  for (const owner of registry.owners) {
    if (!owner.id || ids.has(owner.id)) fail('missing or duplicate owner id: ' + owner.id);
    ids.add(owner.id);
    if (typeof owner.requiresAdr !== 'boolean') fail('owner must explicitly declare requiresAdr: ' + owner.id);
    if (!Array.isArray(owner.paths) || owner.paths.length === 0) fail('owner has no paths: ' + owner.id);
    for (const path of owner.paths) {
      if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('..')) fail('invalid ownership path: ' + path);
      roots.push({ path, owner: owner.id, requiresAdr: owner.requiresAdr });
    }
  }
  for (let i = 0; i < roots.length; i++) for (let j = i + 1; j < roots.length; j++) {
    const a = roots[i], b = roots[j];
    const aPrefix = a.path.endsWith('/') ? a.path : a.path + '/';
    const bPrefix = b.path.endsWith('/') ? b.path : b.path + '/';
    if (a.path === b.path || aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix)) {
      fail('overlapping ownership roots: ' + a.path + ' (' + a.owner + ') and ' + b.path + ' (' + b.owner + ')');
    }
  }
  const ownerFor = file => roots.filter(root => root.path.endsWith('/') ? file.startsWith(root.path) : file === root.path);
  for (const file of new Set(trackedPaths)) {
    const owners = ownerFor(file);
    if (owners.length === 0) fail('tracked repository path has no registered owner: ' + file + '; register an owner before integration');
    if (owners.length > 1) fail('tracked repository path has multiple owners: ' + file);
  }
  const ownedChanges = [];
  const decisionChanges = [];
  for (const file of new Set(changedPaths)) {
    const owners = ownerFor(file);
    if (owners.length === 0) fail('changed path has no registered owner: ' + file + '; register an owner before integration');
    if (owners.length > 1) fail('changed path has multiple owners: ' + file);
    ownedChanges.push(file);
    if (owners[0].requiresAdr) decisionChanges.push(file);
  }
  if (decisionChanges.length) {
    const hasAdr = changedPaths.some(file => file.startsWith('docs/architecture/decisions/') && file.endsWith('.md'));
    const hasContract = changedPaths.some(file => file.startsWith('docs/architecture/feature-contracts/') && file.endsWith('.json'));
    if (!hasAdr && !hasContract) fail('decision-required shared-surface changes require an ADR or feature contract in the same PR: ' + decisionChanges.join(', '));
  }
  return { ownerRoots: roots.length, trackedPaths: new Set(trackedPaths).size, ownedChanges, decisionChanges };
}
function selfTest() {
  const registry = { version: 1, owners: [
    { id: 'worker', paths: ['src/'], requiresAdr: true },
    { id: 'migrations', paths: ['migrations/'], requiresAdr: true },
    { id: 'ci', paths: ['.github/workflows/'], requiresAdr: true },
    { id: 'architecture', paths: ['docs/architecture/'], requiresAdr: true },
    { id: 'archive', paths: ['DEPLOY-1.txt'], requiresAdr: false }
  ] };
  assert.equal(validateOwnership(registry, ['src/index.js', 'docs/architecture/decisions/ADR-0001.md'], ['src/index.js', 'DEPLOY-1.txt']).ownedChanges.length, 2);
  assert.throws(() => validateOwnership(registry, ['src/index.js']), /require an ADR or feature contract/);
  assert.throws(() => validateOwnership(registry, ['scripts/new-unguarded-file.mjs']), /no registered owner/);
  assert.throws(() => validateOwnership(registry, [], ['scripts/existing-unowned-file.mjs']), /tracked repository path has no registered owner/);
  assert.throws(() => validateOwnership({ version: 1, owners: [...registry.owners, { id: 'overlap', paths: ['src/'], requiresAdr: true }] }), /overlapping ownership roots/);
  assert.throws(() => validateOwnership(registry, ['migrations/0009_new.sql']), /require an ADR or feature contract/);
  assert.equal(validateOwnership(registry, ['DEPLOY-1.txt']).decisionChanges.length, 0);
  console.log('PASS: ownership governance self-tests (exact ownership, tracked inventory coverage, unowned-path rejection, ADR requirements, and overlap rejection).');
}
if (process.argv.includes('--self-test')) selfTest();
else {
  const baseSha = process.env.GOVERNANCE_BASE_SHA;
  if (!baseSha) fail('GOVERNANCE_BASE_SHA is required.');
  const registry = JSON.parse(fs.readFileSync('docs/architecture/SHARED-SURFACE-OWNERSHIP.json', 'utf8'));
  const changedPaths = execFileSync('git', ['diff', '--name-only', baseSha + '...HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const trackedPaths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const result = validateOwnership(registry, changedPaths, trackedPaths);
  console.log('PASS: ' + result.ownerRoots + ' ownership roots validated; all ' + result.trackedPaths + ' tracked paths and ' + result.ownedChanges.length + ' changed paths have exactly one owner.');
  if (result.decisionChanges.length) console.log('ADR/feature-contract coverage: ' + result.decisionChanges.length + ' decision-required shared-surface change(s).');
}
