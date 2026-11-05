import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const fail = message => { throw new Error('[governance:migrations] ' + message); };
const migrationPattern = /^migrations\/(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/i;
const reservationPattern = /^migrations\/\.reservations\/(\d{4})\.json$/;

export function validateMigrationInventory(currentEntries, baseEntries = [], currentReservations = [], baseReservations = [], currentPrNumber = null) {
  const parseMigrations = (entries, label) => {
    const parsed = [];
    for (const entry of entries) {
      if (!entry.path.endsWith('.sql')) continue;
      const match = migrationPattern.exec(entry.path);
      if (!match) fail(label + ' contains a SQL migration with a non-canonical filename: ' + entry.path);
      parsed.push({ path: entry.path, number: Number(match[1]), content: entry.content });
    }
    const seen = new Map();
    for (const item of parsed) {
      if (seen.has(item.number)) fail('duplicate migration number ' + String(item.number).padStart(4, '0') + ': ' + seen.get(item.number) + ' and ' + item.path);
      seen.set(item.number, item.path);
    }
    return parsed.sort((a, b) => a.number - b.number);
  };
  const parseReservations = (entries, label) => {
    const parsed = [];
    for (const entry of entries) {
      const match = reservationPattern.exec(entry.path);
      if (!match) fail(label + ' contains a non-canonical migration reservation filename: ' + entry.path);
      let data;
      try { data = JSON.parse(entry.content); } catch { fail(label + ' contains invalid reservation JSON: ' + entry.path); }
      const number = Number(match[1]);
      if (data.version !== 1 || data.number !== number || !Number.isInteger(data.pullRequest) || data.pullRequest < 1 || typeof data.migration !== 'string' || !migrationPattern.test(data.migration) || Number(data.migration.match(migrationPattern)[1]) !== number) {
        fail(label + ' reservation must declare version 1, its filename number, its pull request, and the exact matching migration path: ' + entry.path);
      }
      parsed.push({ path: entry.path, number, migration: data.migration, pullRequest: data.pullRequest, content: entry.content });
    }
    const seen = new Map();
    for (const item of parsed) {
      if (seen.has(item.number)) fail('duplicate migration reservation ' + String(item.number).padStart(4, '0') + ': ' + seen.get(item.number) + ' and ' + item.path);
      seen.set(item.number, item.path);
    }
    return parsed.sort((a, b) => a.number - b.number);
  };

  const current = parseMigrations(currentEntries, 'current tree');
  const base = parseMigrations(baseEntries, 'base tree');
  const reservations = parseReservations(currentReservations, 'current tree');
  const baseReservationList = parseReservations(baseReservations, 'base tree');
  const currentByPath = new Map(current.map(x => [x.path, x]));
  const currentReservationsByPath = new Map(reservations.map(x => [x.path, x]));
  const baseMaxMigration = base.reduce((max, x) => Math.max(max, x.number), 0);
  const baseMaxReservation = baseReservationList.reduce((max, x) => Math.max(max, x.number), 0);
  const baseMax = Math.max(baseMaxMigration, baseMaxReservation);

  for (const old of base) {
    const now = currentByPath.get(old.path);
    if (!now) fail('applied migration was deleted: ' + old.path);
    if (now.content !== old.content) fail('applied migration was modified: ' + old.path + '; add a new forward migration instead');
  }
  for (const old of baseReservationList) {
    const now = currentReservationsByPath.get(old.path);
    if (!now) fail('migration reservation was deleted: ' + old.path);
    if (now.content !== old.content) fail('migration reservation was modified: ' + old.path + '; reservations are immutable');
    if (!base.some(migration => migration.number === old.number && migration.path === old.migration)) {
      fail('base migration reservation ' + old.path + ' has no matching immutable SQL migration in the base tree');
    }
  }

  const basePaths = new Set(base.map(x => x.path));
  const baseReservationPaths = new Set(baseReservationList.map(x => x.path));
  const newReservations = reservations.filter(x => !baseReservationPaths.has(x.path));
  const addedMigrations = current.filter(x => !basePaths.has(x.path));

  for (const item of newReservations) {
    if (item.number <= baseMax) fail('new reservation ' + item.path + ' is not above the highest existing migration/reservation number ' + baseMax);
    if (!Number.isInteger(currentPrNumber) || item.pullRequest !== currentPrNumber) fail('new reservation ' + item.path + ' must be bound to the current pull request number');
    const pairedMigration = addedMigrations.find(migration => migration.number === item.number);
    if (!pairedMigration) fail('new reservation ' + item.path + ' must be accompanied by its SQL migration in the same pull request');
    if (pairedMigration.path !== item.migration) fail('migration ' + pairedMigration.path + ' does not match reservation ' + item.path + ' for ' + item.migration);
  }

  const reservationByNumber = new Map(reservations.map(x => [x.number, x]));
  for (const item of addedMigrations) {
    if (item.number <= baseMaxMigration) fail('new migration ' + item.path + ' reuses or backfills a sequence at or below the base migration maximum ' + baseMaxMigration);
    const reservation = reservationByNumber.get(item.number);
    if (!reservation) fail('new migration ' + item.path + ' has no number reservation; add migrations/.reservations/' + String(item.number).padStart(4, '0') + '.json in the same pull request');
    if (baseReservationPaths.has(reservation.path)) fail('new migration ' + item.path + ' cannot consume an allocation reserved by an earlier pull request');
    if (reservation.migration !== item.path) fail('migration ' + item.path + ' does not match reservation ' + reservation.path + ' for ' + reservation.migration);
    if (!Number.isInteger(currentPrNumber) || reservation.pullRequest !== currentPrNumber) fail('migration reservation ' + reservation.path + ' is not bound to the current pull request');
  }

  return {
    count: current.length,
    baseCount: base.length,
    baseMax,
    highestAllocatedNumber: Math.max(baseMax, reservations.reduce((max, x) => Math.max(max, x.number), 0)),
    added: addedMigrations.map(x => x.path),
    reservationCount: reservations.length,
    newReservations: newReservations.map(x => x.path)
  };
}

function selfTest() {
  const base = [
    { path: 'migrations/0001_initial.sql', content: 'CREATE TABLE a(id INTEGER);' },
    { path: 'migrations/0002_accounts.sql', content: 'CREATE TABLE b(id INTEGER);' }
  ];
  const validReservation = { path: 'migrations/.reservations/0003.json', content: JSON.stringify({ version: 1, number: 3, migration: 'migrations/0003_reader.sql', pullRequest: 77 }) };
  const valid = [...base, { path: 'migrations/0003_reader.sql', content: 'CREATE TABLE c(id INTEGER);' }];
  assert.equal(validateMigrationInventory(valid, base, [validReservation], [], 77).added.length, 1);
  assert.throws(() => validateMigrationInventory(base, base, [validReservation], [], 77), /same pull request/);
  assert.throws(() => validateMigrationInventory([...valid, { path: 'migrations/0003_duplicate.sql', content: '' }], base, [validReservation], [], 77), /duplicate migration number/);
  assert.throws(() => validateMigrationInventory([{ ...base[0], content: 'DROP TABLE a;' }, base[1]], base), /was modified/);
  assert.throws(() => validateMigrationInventory([base[1]], base), /was deleted/);
  assert.throws(() => validateMigrationInventory([...base, { path: 'migrations/0003_reader.sql', content: '' }], base, [], [], 77), /no number reservation/);
  assert.throws(() => validateMigrationInventory(valid, base, [{ path: 'migrations/.reservations/0003.json', content: JSON.stringify({ version: 1, number: 3, migration: 'migrations/0003_other.sql', pullRequest: 77 }) }], [], 77), /does not match reservation/);
  assert.throws(() => validateMigrationInventory(valid, base, [{ path: 'migrations/.reservations/0003.json', content: JSON.stringify({ version: 1, number: 3, migration: 'migrations/0003_reader.sql', pullRequest: 78 }) }], [], 77), /bound to the current pull request/);
  assert.throws(() => validateMigrationInventory(base, base, [{ path: 'migrations/.reservations/0002.json', content: JSON.stringify({ version: 1, number: 2, migration: 'migrations/0002_old.sql', pullRequest: 77 }) }], [], 77), /not above the highest existing/);
  assert.throws(() => validateMigrationInventory(base, base, [], [validReservation], 77), /reservation was deleted/);
  assert.throws(() => validateMigrationInventory(base, base, [validReservation], [validReservation], 77), /has no matching immutable SQL migration/);
  assert.throws(() => validateMigrationInventory(base, base, [{ path: validReservation.path, content: JSON.stringify({ version: 1, number: 3, migration: 'migrations/0003_reader.sql', pullRequest: 77, edited: true }) }], [validReservation], 77), /reservation was modified/);
  assert.throws(() => validateMigrationInventory(base, base, [
    { path: 'migrations/.reservations/0004.json', content: JSON.stringify({ version: 1, number: 4, migration: 'migrations/0004_x.sql', pullRequest: 77 }) },
    { path: 'migrations/.reservations/0004.json', content: JSON.stringify({ version: 1, number: 4, migration: 'migrations/0004_y.sql', pullRequest: 77 }) }
  ], [], 77), /duplicate migration reservation/);
  assert.throws(() => validateMigrationInventory(base, base, [{ path: 'migrations/.reservations/0004-invalid.json', content: '{}' }], [], 77), /non-canonical migration reservation filename/);
  assert.throws(() => validateMigrationInventory([...base, { path: 'migrations/0003bad.sql', content: '' }], base, [], [], 77), /non-canonical filename/);
  console.log('PASS: migration governance self-tests (immutable SQL history, immutable reservations, unique forward reservations, exact migration binding, PR binding, and same-PR allocation).');
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const baseSha = process.env.GOVERNANCE_BASE_SHA;
  if (!baseSha) fail('GOVERNANCE_BASE_SHA is required; run this gate in a pull_request workflow.');
  const directory = 'migrations';
  if (!fs.existsSync(directory)) fail('migrations directory is missing');
  const walk = (absoluteDirectory, relativeDirectory) => fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(absoluteDirectory, entry.name);
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) fail('symbolic links are not allowed in the migration inventory: ' + relativePath);
    if (entry.isDirectory()) return walk(absolutePath, relativePath);
    if (!entry.isFile()) fail('unsupported filesystem entry in migration inventory: ' + relativePath);
    return [{ path: relativePath, content: fs.readFileSync(absolutePath, 'utf8') }];
  });
  const inventoryFiles = walk(directory, directory);
  const currentEntries = inventoryFiles.filter(entry => entry.path.endsWith('.sql'));
  const currentReservations = inventoryFiles.filter(entry => entry.path.startsWith('migrations/.reservations/'));
  const basePaths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseSha, '--', directory], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const baseEntries = basePaths.filter(file => file.endsWith('.sql')).map(file => ({
    path: file,
    content: execFileSync('git', ['show', baseSha + ':' + file], { encoding: 'utf8' })
  }));
  const baseReservations = basePaths.filter(file => file.startsWith('migrations/.reservations/')).map(file => ({
    path: file,
    content: execFileSync('git', ['show', baseSha + ':' + file], { encoding: 'utf8' })
  }));
  const currentPrNumber = Number(process.env.GOVERNANCE_PR_NUMBER);
  if (!Number.isInteger(currentPrNumber) || currentPrNumber < 1) fail('GOVERNANCE_PR_NUMBER is required; migration reservations must bind to the current pull request.');
  const result = validateMigrationInventory(currentEntries, baseEntries, currentReservations, baseReservations, currentPrNumber);
  console.log('PASS: ' + result.count + ' migration files inventoried; ' + result.baseCount + ' base migrations are unchanged; highest allocated number is ' + result.highestAllocatedNumber + ' (base maximum ' + result.baseMax + ').');
  console.log('Immutable reservations: ' + result.reservationCount + '; new reservations: ' + (result.newReservations.join(', ') || 'none') + '.');
  if (result.added.length) console.log('Forward migrations: ' + result.added.join(', '));
  else console.log('No new migrations in this pull request.');
}
