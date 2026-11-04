import assert from 'node:assert/strict';

const fail = message => { throw new Error('[governance:migration-collision] ' + message); };
const migrationNumber = file => {
  const match = /^migrations\/(\d{4})_[a-z0-9][a-z0-9_-]*\.sql$/i.exec(file);
  return match ? Number(match[1]) : null;
};
export function findConcurrentMigrationCollisions(currentNumber, pullRequests) {
  const collisions = [];
  for (const pr of pullRequests) {
    if (pr.number === currentNumber) continue;
    const numbers = new Map();
    for (const file of pr.files || []) {
      const number = migrationNumber(file);
      if (number === null) continue;
      if (!numbers.has(number)) numbers.set(number, []);
      numbers.get(number).push(file);
    }
    for (const [number, files] of numbers) {
      if (files.length > 1) collisions.push({ pr: pr.number, number, files });
    }
  }
  return collisions;
}
function selfTest() {
  const prs = [
    { number: 219, files: ['migrations/0013_reader.sql'] },
    { number: 220, files: ['migrations/0013_profile.sql'] },
    { number: 221, files: ['migrations/0014_unique.sql'] }
  ];
  const collisions = findConcurrentMigrationCollisions(219, prs);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].number, 13);
  assert.equal(findConcurrentMigrationCollisions(219, [{ number: 220, files: ['migrations/0014_unique.sql'] }]).length, 0);
  console.log('PASS: concurrent migration allocation fixtures (duplicate number rejected; distinct number accepted).');
}
if (process.argv.includes('--self-test')) selfTest();
else {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!token || !repository || !eventPath) fail('GitHub pull-request context and read-only token are required; refusing to skip.');
  const event = JSON.parse((await import('node:fs')).readFileSync(eventPath, 'utf8'));
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
      }
      pullRequests.push({ number: pr.number, files });
    }
    if (items.length < 100) break;
  }
  const collisions = findConcurrentMigrationCollisions(current.number, pullRequests);
  const currentFiles = (await github('/pulls/' + current.number + '/files?per_page=100')).map(item => item.filename);
  const currentAllocations = currentFiles.map(file => ({ file, number: migrationNumber(file) })).filter(x => x.number !== null);
  const conflicting = collisions.filter(c => currentAllocations.some(x => x.number === c.number));
  if (conflicting.length) {
    for (const item of conflicting) console.error('PR #' + item.pr + ' independently allocates migration ' + String(item.number).padStart(4, '0') + ': ' + item.files.join(', '));
    fail('Concurrent open PRs allocate the same migration sequence. Restack and reallocate against the newly integrated main.');
  }
  console.log('PASS: no open main-targeted PR independently allocates a migration number used by this PR (' + currentAllocations.length + ' proposed migration(s)).');
}
