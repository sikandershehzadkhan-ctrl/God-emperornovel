import assert from 'node:assert/strict';

const fail = message => { throw new Error('[governance:migration-collision] ' + message); };
const migrationNumber = file => {
  const sql = /^migrations\/(\d{4})_[a-z0-9][a-z0-9_-]*\.sql$/i.exec(file);
  if (sql) return Number(sql[1]);
  const reservation = /^migrations\/\.reservations\/(\d{4})\.json$/.exec(file);
  return reservation ? Number(reservation[1]) : null;
};
export function findConcurrentMigrationCollisions(currentNumber, pullRequests) {
  const allocations = new Map();
  for (const pr of pullRequests) {
    if (pr.number === currentNumber) continue;
    const numbersForPr = new Set();
    for (const file of pr.files || []) {
      const number = migrationNumber(file);
      if (number !== null) numbersForPr.add(number);
    }
    for (const number of numbersForPr) {
      if (!allocations.has(number)) allocations.set(number, []);
      allocations.get(number).push({ pr: pr.number });
    }
  }
  return [...allocations].filter(([, entries]) => new Set(entries.map(x => x.pr)).size > 1)
    .map(([number, entries]) => ({ number, entries }));
}
function selfTest() {
  const prs = [
    { number: 219, files: ['migrations/0013_reader.sql', 'migrations/.reservations/0013.json'] },
    { number: 220, files: ['migrations/0013_profile.sql', 'migrations/.reservations/0013.json'] },
    { number: 221, files: ['migrations/0014_unique.sql', 'migrations/.reservations/0014.json'] }
  ];
  const collisions = findConcurrentMigrationCollisions(0, prs);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].number, 13);
  assert.deepEqual(collisions[0].entries.map(x => x.pr), [219, 220]);
  assert.equal(findConcurrentMigrationCollisions(219, prs).length, 0);
  assert.equal(findConcurrentMigrationCollisions(0, [{ number: 220, files: ['migrations/0014_unique.sql', 'migrations/.reservations/0014.json'] }]).length, 0);
  console.log('PASS: concurrent migration allocation fixtures (duplicate SQL or reservation numbers across PRs rejected; distinct numbers accepted).');
}
if (process.argv.includes('--self-test')) selfTest();
else {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!token || !repository || !eventPath) fail('GitHub pull-request context and read-only token are required; refusing to skip.');
  const fs = await import('node:fs');
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const current = event.pull_request;
  if (!current) fail('Expected a pull_request event.');
  async function github(path) {
    const response = await fetch('https://api.github.com/repos/' + repository + path, {
      headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + token, 'x-github-api-version': '2022-11-28' },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) fail('GitHub API ' + response.status + ' for ' + path + ': ' + (await response.text()).slice(0, 400));
    return response.json();
  }
  const pullRequests = [];
  for (let page = 1; page <= 10; page++) {
    const items = await github('/pulls?state=open&base=main&per_page=100&page=' + page);
    for (const pr of items) {
      if (pr.number === current.number) continue;
      const files = [];
      for (let filePage = 1; filePage <= 10; filePage++) {
        const changed = await github('/pulls/' + pr.number + '/files?per_page=100&page=' + filePage);
        files.push(...changed.map(item => item.filename));
        if (changed.length < 100) break;
        if (filePage === 10) fail('PR #' + pr.number + ' exceeds the supported changed-file scan limit; refusing to skip collision detection.');
      }
      pullRequests.push({ number: pr.number, files });
    }
    if (items.length < 100) break;
    if (page === 10) fail('More than 1000 open main-targeted pull requests; refusing to skip migration collision detection.');
  }
  const collisions = findConcurrentMigrationCollisions(current.number, pullRequests);
  const currentFiles = [];
  for (let page = 1; page <= 10; page++) {
    const changed = await github('/pulls/' + current.number + '/files?per_page=100&page=' + page);
    currentFiles.push(...changed.map(item => item.filename));
    if (changed.length < 100) break;
    if (page === 10) fail('Current PR exceeds the supported changed-file scan limit; refusing to skip collision detection.');
  }
  const currentAllocations = currentFiles.map(file => ({ file, number: migrationNumber(file) })).filter(x => x.number !== null);
  const conflicting = collisions.filter(c => currentAllocations.some(x => x.number === c.number));
  if (conflicting.length) {
    for (const item of conflicting) {
      console.error('Migration number ' + String(item.number).padStart(4, '0') + ' is independently allocated by: PRs ' + item.entries.map(x => '#' + x.pr).join(', '));
    }
    fail('Concurrent open main-targeted PRs allocate the same migration/reservation number. Restack and reallocate against the newly integrated main.');
  }
  console.log('PASS: no open main-targeted PR independently allocates a migration or reservation number used by this PR (' + currentAllocations.length + ' allocation file(s)).');
}
