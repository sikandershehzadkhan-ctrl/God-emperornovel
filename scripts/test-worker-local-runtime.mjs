import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';

const port = 8787;
const origin = `http://127.0.0.1:${port}`;
const child = spawn('npx', ['--yes', 'wrangler@4', 'dev', '--local', '--ip', '127.0.0.1', '--port', String(port), '--persist-to', '.wrangler/test-runtime'], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NO_COLOR: '1' },
});
let output = '';
child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk; });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, options = {}) {
  const response = await fetch(origin + path, { ...options, signal: AbortSignal.timeout(2500) });
  return { response, body: await response.text() };
}
try {
  let ready = false;
  let lastError = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (child.exitCode !== null) throw new Error(`Wrangler exited early (${child.exitCode}).\n${output}`);
    try {
      const health = await request('/api/health');
      const data = JSON.parse(health.body);
      if (health.response.ok && data.ok === true && data.database === true) { ready = true; break; }
      lastError = new Error(`Health returned ${health.response.status}: ${health.body}`);
    } catch (error) { lastError = error; }
    await sleep(1000);
  }
  assert.ok(ready, `Local Worker+D1 did not become healthy: ${lastError?.message || 'timeout'}\n${output}`);

  const catalog = await request('/api/novels');
  assert.equal(catalog.response.status, 200, `Catalog route failed: ${catalog.body}`);
  const catalogData = JSON.parse(catalog.body);
  assert.ok(Array.isArray(catalogData.results), 'Catalog must return a results array');

  const overview = await request('/api/platform/overview');
  assert.equal(overview.response.status, 200, `Platform overview failed: ${overview.body}`);
  const overviewData = JSON.parse(overview.body);
  assert.equal(typeof overviewData.metrics?.publishedNovels, 'number', 'Overview must return numeric live metrics');

  const taxonomySubmit = await request('/api/taxonomy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'tag', name: 'Unauthenticated Runtime Probe', creator_id: 1, creator_name: 'Spoofed Owner' }) });
  assert.equal(taxonomySubmit.response.status, 401, 'Taxonomy submissions must require an authenticated session');

  const missingChapter = await request('/api/chapters/2147483000');
  assert.equal(missingChapter.response.status, 404, 'Unknown chapter must return 404');
  assert.ok(JSON.parse(missingChapter.body).error, 'Unknown chapter response must be a structured error');

  const suffix = Date.now().toString(36);
  async function createRuntimeAccount(label) {
    const username = `rt_${label}_${suffix}`;
    const email = `${username}@example.invalid`;
    const password = `Runtime-Test-${suffix}-Only!`;
    const registration = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    assert.equal(registration.response.status, 200, `Runtime account registration failed: ${registration.body}`);
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.response.status, 200, `Runtime account login failed: ${login.body}`);
    const setCookie = login.response.headers.get('set-cookie') || '';
    const cookiePair = setCookie.split(';', 1)[0];
    assert.match(cookiePair, /^session=.+$/, 'Login must issue an HttpOnly session cookie');
    return { username, email, cookie: cookiePair };
  }
  const accountA = await createRuntimeAccount('a');
  const accountB = await createRuntimeAccount('b');
  // Create isolated, deterministic content fixtures in the Wrangler-local D1 only.
  // High fixed IDs avoid dependence on production-like catalog seed data.
  const fixtureSql = [
    'DELETE FROM notifications WHERE id IN (2147483002,2147483003)',
    'DELETE FROM chapters WHERE id=2147483001',
    'DELETE FROM novels WHERE id=2147483001',
    "INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES(2147483001,'Runtime Isolation Fixture','Runtime Test','published','original')",
    "INSERT INTO chapters(id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(2147483001,2147483001,1,'Runtime Isolation Chapter','Fixture body',0,0,'published')",
    `INSERT INTO notifications(id,user_id,title,body) VALUES(2147483002,${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountA.cookie}})).body)).user.id)},'A-only notification','Private to A')`,
    `INSERT INTO notifications(id,user_id,title,body) VALUES(2147483003,${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountB.cookie}})).body)).user.id)},'B-only notification','Private to B')`
  ].join('; ');
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',fixtureSql], { stdio:'pipe', env:{...process.env,NO_COLOR:'1'} });

  const profileA = await request('/api/profile', { headers: { cookie: accountA.cookie } });
  const profileB = await request('/api/profile', { headers: { cookie: accountB.cookie } });
  assert.equal(profileA.response.status, 200, `Account A profile failed: ${profileA.body}`);
  assert.equal(profileB.response.status, 200, `Account B profile failed: ${profileB.body}`);
  const dataA = JSON.parse(profileA.body);
  const dataB = JSON.parse(profileB.body);
  assert.notEqual(dataA.user.id, dataB.user.id, 'Two independent registrations must have distinct user IDs');
  assert.equal(dataA.user.username, accountA.username, 'Account A session must resolve to Account A');
  assert.equal(dataA.user.email, accountA.email, 'Account A profile must expose only Account A identity');
  assert.equal(dataB.user.username, accountB.username, 'Account B session must resolve to Account B');
  assert.equal(dataB.user.email, accountB.email, 'Account B profile must expose only Account B identity');
  const novelId = 2147483001;
  const chapterNumber = 1;
  const jsonHeaders = { 'content-type': 'application/json' };
  async function postAs(account, path, payload) {
    return request(path, { method:'POST', headers:{...jsonHeaders,cookie:account.cookie}, body:JSON.stringify(payload) });
  }
  async function getAs(account, path) {
    return request(path, { headers:{cookie:account.cookie} });
  }

  // Every write deliberately supplies the OTHER account's ID. The server must ignore it.
  const libraryWrite = await postAs(accountA, '/api/library', { novel_id:novelId, user_id:dataB.user.id });
  assert.equal(libraryWrite.response.status, 200, `Account A library write failed: ${libraryWrite.body}`);
  const libraryA = await getAs(accountA, '/api/library');
  const libraryB = await getAs(accountB, '/api/library');
  assert.ok(JSON.parse(libraryA.body).some(x=>Number(x.novel_id)===novelId), 'Account A must see its own library entry');
  assert.ok(!JSON.parse(libraryB.body).some(x=>Number(x.novel_id)===novelId), 'Account B must not see Account A library entry');

  const historyWrite = await postAs(accountA, '/api/history', { novel_id:novelId, chapter_number:chapterNumber, user_id:dataB.user.id });
  assert.equal(historyWrite.response.status, 200, `Account A history write failed: ${historyWrite.body}`);
  const historyA = await getAs(accountA, '/api/history');
  const historyB = await getAs(accountB, '/api/history');
  assert.ok(JSON.parse(historyA.body).some(x=>Number(x.novel_id)===novelId), 'Account A must see its own reading history');
  assert.ok(!JSON.parse(historyB.body).some(x=>Number(x.novel_id)===novelId), 'Account B must not see Account A reading history');

  const bookmarkWrite = await postAs(accountA, '/api/bookmark', { novel_id:novelId, chapter_number:chapterNumber, user_id:dataB.user.id });
  assert.equal(bookmarkWrite.response.status, 200, `Account A bookmark write failed: ${bookmarkWrite.body}`);
  const bookmarksA = await getAs(accountA, '/api/bookmarks');
  const bookmarksB = await getAs(accountB, '/api/bookmarks');
  assert.ok(JSON.parse(bookmarksA.body).some(x=>Number(x.novel_id)===novelId), 'Account A must see its own bookmark');
  assert.ok(!JSON.parse(bookmarksB.body).some(x=>Number(x.novel_id)===novelId), 'Account B must not see Account A bookmark');

  const positionWrite = await postAs(accountA, '/api/reading-position', { novel_id:novelId, chapter_number:chapterNumber, progress_percent:73, user_id:dataB.user.id });
  assert.equal(positionWrite.response.status, 200, `Account A reading-position write failed: ${positionWrite.body}`);
  const positionA = await getAs(accountA, `/api/reading-position?novel_id=${novelId}&chapter_number=${chapterNumber}&user_id=${dataB.user.id}`);
  const positionB = await getAs(accountB, `/api/reading-position?novel_id=${novelId}&chapter_number=${chapterNumber}&user_id=${dataA.user.id}`);
  assert.equal(JSON.parse(positionA.body).progress_percent, 73, 'Account A must read its own saved position despite hostile user_id query');
  assert.equal(JSON.parse(positionB.body).progress_percent, 0, 'Account B must not read Account A saved position');

  const notificationsA = await getAs(accountA, '/api/notifications');
  const notificationsB = await getAs(accountB, '/api/notifications');
  assert.ok(JSON.parse(notificationsA.body).some(x=>x.title==='A-only notification'), 'Account A must see its own notification');
  assert.ok(!JSON.parse(notificationsA.body).some(x=>x.title==='B-only notification'), 'Account A must not see Account B notification');
  assert.ok(JSON.parse(notificationsB.body).some(x=>x.title==='B-only notification'), 'Account B must see its own notification');
  assert.ok(!JSON.parse(notificationsB.body).some(x=>x.title==='A-only notification'), 'Account B must not see Account A notification');

  const anonymousLibrary = await request('/api/library');
  assert.equal(anonymousLibrary.response.status, 401, 'Private library must reject anonymous requests');
  const anonymousHistory = await request('/api/history');
  assert.equal(anonymousHistory.response.status, 401, 'Private history must reject anonymous requests');
  const anonymousBookmarks = await request('/api/bookmarks');
  assert.equal(anonymousBookmarks.response.status, 401, 'Private bookmarks must reject anonymous requests');

  const crossAccountProbe = await request(`/api/profile?user_id=${dataB.user.id}`, { headers: { cookie: accountA.cookie } });
  assert.equal(crossAccountProbe.response.status, 200, 'Authenticated profile request must remain valid with an untrusted user_id query');
  const crossAccountData = JSON.parse(crossAccountProbe.body);
  assert.equal(crossAccountData.user.id, dataA.user.id, 'Account A must never switch identity based on a client-supplied user_id');
  assert.notEqual(crossAccountData.user.email, accountB.email, 'Account A response must not disclose Account B email');
  const anonymousProfile = await request('/api/profile');
  assert.equal(anonymousProfile.response.status, 401, 'Private profile must reject anonymous requests');

  const home = await request('/');
  assert.equal(home.response.status, 200, 'Home page must be served by the Worker');
  assert.match(home.body, /Imperial Novel/, 'Home page must contain the platform brand');
  console.log('PASS: real Wrangler local Worker handled health, D1-backed catalog, live overview, unauthenticated taxonomy rejection, missing chapter, two independent account registrations/logins, session-bound profile isolation, cross-account library/history/bookmark/reading-position/notification isolation, hostile user_id write/query handling, anonymous private-resource rejection and homepage requests.');
} finally {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(5000)]);
}
