import assert from 'node:assert/strict';

const fail = message => { throw new Error('[governance:migration-collision] ' + message); };
const migrationNumber = file => {
  const sql = /^migrations\\/(\\d{4})_[a-z0-9][a-z0-9_-]*\\.sql$/i.exec(file);
  if (sql) return Number(sql[1]);
  const reservation = /^migrations\\/\\.reservations\\/(\\d{4})\\.json$/.exec(file);
  return reservation ? Number(reservation[1]) : null;
};
export function findConcurrentMigrationCollisions(currentNumber, currentFiles, pullRequests) {
  const allocations = new Map();
  const addPr = (number, files) => {
    const numbersForPr = new Set(files.map(migrationNumber).filter(number => number !== null));
    for (const allocated of numbersForPr) {
      if (!allocations.has(allocated)) allocations.set(allocated, []);
      allocations.get(allocated).push({ pr: number });
    }
  };
  addPr(currentNumber, currentFiles);
  for (const pr of pullRequests) {
    if (pr.number !== currentNumber) addPr(pr.number, pr.files || []);
  }
  return [...allocations]
    .filter(([, entries]) => entries.some(x => x.pr === currentNumber) && new Set(entries.map(x => x.pr)).size > 1)
    .map(([number, entries]) => ({ number, entries }));
}
function selfTest() {
  const prs = [
    { number: 219, files: ['migrations/0013_reader.sql', 'migrations/.reservations/0013.json'] },
    { number: 220, files: ['migrations/0013_profile.sql', 'migrations/.reservations/0013.json'] },
    { number: 221, files: ['migrations/0014_unique.sql', 'migrations/.reservations/0014.json'] }
  ];
  const collision = findConcurrentMigrationCollisions(220, prs[1].files, [prs[0], prs[2]]);
  assert.equal(collision.length, 1);
  assert.equal(collision[0].number, 13);
  assert.deepEqual(collision[0].entries.map(x => x.pr), [220, 219]);
  assert.equal(findConcurrentMigrationCollisions(220, prs[1].files, [prs[2]]).length, 0);
  assert.equal(findConcurrentMigrationCollisions(220, [], [prs[0], prs[2]]).length, 0);
  console.log('PASS: current-PR collision fixtures (current PR conflicts with another PR; distinct allocations pass).');
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
  async function github(apiPath) {
    const response = await fetch('https://api.github.com/repos/' + repository + apiPath, {
      headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + token, 'x-github-api-version': '2022-11-28' },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) fail('GitHub API ' + response.status + ' for ' + apiPath + ': ' + (await response.text()).slice(0, 400));
    return response.json();
  }
  async function changedFiles(prNumber) {
    const files = [];
    for (let page = 1; page <= 10; page++) {
      const changed = await github('/pulls/' + prNumber + '/files?per_page=100&page=' + page);
      files.push(...changed.map(item => item.filename));
      if (changed.length < 100) return files;
      if (page === 10) fail('PR #' + prNumber + ' exceeds the supported changed-file scan limit; refusing to skip collision detection.');
    }
    return files;
  }
  const pullRequests = [];
  for (let page = 1; page <= 10; page++) {
    const items = await github('/pulls?state=open&base=main&per_page=100&page=' + page);
    for (const pr of items) {
      if (pr.number === current.number) continue;
      pullRequests.push({ number: pr.number, files: await changedFiles(pr.number) });
    }
    if (items.length < 100) break;
    if (page === 10) fail('More than 1000 open main-targeted pull requests; refusing to skip migration collision detection.');
  }
  const currentFiles = await changedFiles(current.number);
  const collisions = findConcurrentMigrationCollisions(current.number, currentFiles, pullRequests);
  if (collisions.length) {
    for (const item of collisions) {
      console.error('Migration number ' + String(item.number).padStart(4, '0') + ' is independently allocated by: PRs ' + item.entries.map(x => '#' + x.pr).join(', '));
    }
    fail('Concurrent open main-targeted PRs allocate the same migration or reservation number. Restack and reallocate against the newly integrated main.');
  }
  const currentAllocations = currentFiles.filter(file => migrationNumber(file) !== null);
  console.log('PASS: no open main-targeted PR independently allocates a migration or reservation number used by this PR (' + currentAllocations.length + ' allocation file(s)).');
}
