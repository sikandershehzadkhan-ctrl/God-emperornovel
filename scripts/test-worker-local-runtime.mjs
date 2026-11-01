import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

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
    const token = setCookie.match(/(?:^|;\\s*)session=([^;]+)/)?.[1];
    assert.ok(token, 'Login must issue an HttpOnly session cookie');
    return { username, email, cookie: `session=${token}` };
  }
  const accountA = await createRuntimeAccount('a');
  const accountB = await createRuntimeAccount('b');
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
  console.log('PASS: real Wrangler local Worker handled health, D1-backed catalog, live overview, unauthenticated taxonomy rejection, missing chapter, two independent account registrations/logins, session-bound profile isolation, hostile user_id query handling, anonymous profile rejection and homepage requests.');
} finally {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(5000)]);
}
