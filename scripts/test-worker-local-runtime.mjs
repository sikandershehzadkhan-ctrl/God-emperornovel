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
async function request(path) {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(2500) });
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

  const missingChapter = await request('/api/chapters/2147483000');
  assert.equal(missingChapter.response.status, 404, 'Unknown chapter must return 404');
  assert.ok(JSON.parse(missingChapter.body).error, 'Unknown chapter response must be a structured error');

  const home = await request('/');
  assert.equal(home.response.status, 200, 'Home page must be served by the Worker');
  assert.match(home.body, /Imperial Novel/, 'Home page must contain the platform brand');
  console.log('PASS: real Wrangler local Worker handled health, D1-backed catalog, live overview, missing chapter and homepage requests.');
} finally {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(5000)]);
}
