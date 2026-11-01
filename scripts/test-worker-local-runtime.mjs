import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';

// Apply the checked-in D1 migration chain to a disposable local database before Worker startup.
execFileSync('npx', ['--yes','wrangler@4','d1','migrations','apply','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime'], { stdio:'pipe', env:{...process.env,NO_COLOR:'1'} });

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
    return { username, email, password, cookie: cookiePair };
  }
  const accountA = await createRuntimeAccount('a');
  const accountB = await createRuntimeAccount('b');
  // Create isolated, deterministic content fixtures in the Wrangler-local D1 only.
  // High fixed IDs avoid dependence on production-like catalog seed data.
  const fixtureSql = [
    'DELETE FROM notifications WHERE id IN (2147483002,2147483003)',
    'DELETE FROM chapters WHERE id IN (2147483004,2147483005,2147483006)',
    'DELETE FROM novels WHERE id IN (2147483004,2147483005)',
    `UPDATE users SET role='author' WHERE id IN (${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountA.cookie}})).body)).user.id)},${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountB.cookie}})).body)).user.id)})`,
    `INSERT INTO novels(id,title,author,rights_status,owner_user_id,publication_status) VALUES(2147483004,'Author A Private Novel','Author A','original',${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountA.cookie}})).body)).user.id)},'draft')`,
    `INSERT INTO novels(id,title,author,rights_status,owner_user_id,publication_status) VALUES(2147483005,'Author B Private Novel','Author B','original',${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountB.cookie}})).body)).user.id)},'draft')`,
    "INSERT INTO chapters(id,novel_id,chapter_number,title,content,publication_status) VALUES(2147483004,2147483004,1,'A private chapter','A-only draft','draft')",
    "INSERT INTO chapters(id,novel_id,chapter_number,title,content,publication_status) VALUES(2147483005,2147483005,1,'B private chapter','B-only draft','draft')",
    'DELETE FROM chapters WHERE id=2147483001',
    'DELETE FROM novels WHERE id=2147483001',
    "INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES(2147483001,'Runtime Isolation Fixture','Runtime Test','published','original')",
    "INSERT INTO chapters(id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(2147483001,2147483001,1,'Runtime Isolation Chapter','Fixture body',0,0,'published')",
    `UPDATE users SET tickets=10 WHERE email='rt_a_${suffix}@example.invalid'`,
    "INSERT INTO chapters(id,novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status) VALUES(2147483006,2147483001,2,'Concurrent Unlock Fixture','Paid fixture body',1,3,'published')",
    `INSERT INTO notifications(id,user_id,title,body) VALUES(2147483002,${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountA.cookie}})).body)).user.id)},'A-only notification','Private to A')`,
    `INSERT INTO notifications(id,user_id,title,body) VALUES(2147483003,${Number((JSON.parse((await request('/api/profile',{headers:{cookie:accountB.cookie}})).body)).user.id)},'B-only notification','Private to B')`
  ].join('; ');
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',fixtureSql], { stdio:'pipe', env:{...process.env,NO_COLOR:'1'} });

  const concurrentUnlocks = await Promise.all([
    request('/api/chapters/2147483006/unlock',{method:'POST',headers:{cookie:accountA.cookie}}),
    request('/api/chapters/2147483006/unlock',{method:'POST',headers:{cookie:accountA.cookie}})
  ]);
  assert.ok(concurrentUnlocks.every(x=>[200,409].includes(x.response.status)),'Concurrent duplicate unlock requests must either succeed idempotently or return a conflict');
  assert.ok(concurrentUnlocks.some(x=>x.response.status===200),'At least one concurrent chapter unlock request must grant access');
  for(const result of concurrentUnlocks.filter(x=>x.response.status===200))assert.equal(JSON.parse(result.body).tickets,7,'Every successful or idempotent unlock response must report the current balance, not a stale pre-charge value');
  const unlockedChapter = await getAs(accountA,'/api/chapters/2147483006');
  assert.equal(JSON.parse(unlockedChapter.body).unlocked,true,'Concurrent unlock requests must grant chapter access');
  const postUnlockProfile = await getAs(accountA,'/api/profile');
  assert.equal(Number(JSON.parse(postUnlockProfile.body).user.tickets),7,'Concurrent duplicate unlocks must debit the account exactly once');
  const unlockLedger = await getAs(accountA,'/api/tickets/ledger');
  assert.equal(JSON.parse(unlockLedger.body).filter(x=>x.reason==='chapter_unlock'&&x.reference==='2147483006'&&Number(x.delta)===-3).length,1,'Concurrent duplicate unlocks must create exactly one matching ledger entry');
  const profileA = await request('/api/profile', { headers: { cookie: accountA.cookie } });
  const profileB = await request('/api/profile', { headers: { cookie: accountB.cookie } });
  assert.equal(profileA.response.status, 200, `Account A profile failed: ${profileA.body}`);
  assert.equal(profileB.response.status, 200, `Account B profile failed: ${profileB.body}`);
  const dataA = JSON.parse(profileA.body);
  const dataB = JSON.parse(profileB.body);

  // Seed unmistakable internal rights/reviewer values on a published novel in local D1.
  // Public catalog and reader routes must never serialize these private columns.
  const privateSentinels = [
    'RIGHTS_EVIDENCE_PRIVATE_SENTINEL',
    'RIGHTS_NOTES_PRIVATE_SENTINEL',
    'REVIEW_FEEDBACK_PRIVATE_SENTINEL',
    'OWNER_ID_PRIVATE_SENTINEL',
    'REVIEWER_ID_PRIVATE_SENTINEL',
    'RIGHTS_VERIFIER_ID_PRIVATE_SENTINEL'
  ];
  const privateNovelSql = `UPDATE novels SET owner_user_id=${dataA.user.id},rights_evidence='${privateSentinels[0]}',rights_notes='${privateSentinels[1]}',rights_verified_by=2147483091,rights_verified_at='RIGHTS_VERIFIED_AT_PRIVATE_SENTINEL',review_feedback='${privateSentinels[2]}',reviewed_by=2147483092,reviewed_at='REVIEWED_AT_PRIVATE_SENTINEL' WHERE id=2147483001`;
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',privateNovelSql], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  await getAs(accountA, '/api/omni/jobs'); // Ensure authenticated route state is initialized before recommendation routes.
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`INSERT OR IGNORE INTO follows(user_id,novel_id) VALUES(${dataA.user.id},2147483001)`], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  function assertNoPrivateNovelData(label, payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const field of ['owner_user_id','rights_evidence','rights_notes','rights_verified_by','rights_verified_at','rights_verified_at','review_feedback','reviewed_by','reviewed_at']) {
      assert.ok(!serialized.includes(field), `${label} must not expose private field ${field}`);
    }
    for (const sentinel of [...privateSentinels,'RIGHTS_VERIFIED_AT_PRIVATE_SENTINEL','REVIEWED_AT_PRIVATE_SENTINEL']) {
      assert.ok(!serialized.includes(sentinel), `${label} must not expose private sentinel ${sentinel}`);
    }
  }
  const publicNovelRoutes = [
    ['/api/novels', null],
    ['/api/novels/2147483001', null],
    ['/api/made-for-you', null],
    ['/api/made-for-you', accountA],
    ['/api/recommendations', accountA],
    ['/api/follows', accountA]
  ];
  for (const [route, account] of publicNovelRoutes) {
    const response = account ? await getAs(account, route) : await request(route);
    assert.equal(response.response.status, 200, `${route} failed during private-data sentinel test: ${response.body}`);
    assertNoPrivateNovelData(`${route} (${account ? 'authenticated' : 'anonymous'})`, response.body);
  }
  const publicDetailSentinel = await request('/api/novels/2147483001');
  const publicDetailData = JSON.parse(publicDetailSentinel.body);
  assert.equal(publicDetailData.title, 'Runtime Isolation Fixture', 'Public novel detail must retain approved reader-facing fields');
  assert.ok(Array.isArray(publicDetailData.chapters), 'Public novel detail must retain published chapter data');
  const publicCatalogData = JSON.parse((await request('/api/novels')).body);
  assert.ok(publicCatalogData.results.some(row=>Number(row.id)===2147483001), 'Public catalog must retain eligible published novels');

  assert.notEqual(dataA.user.id, dataB.user.id, 'Two independent registrations must have distinct user IDs');
  assert.equal(dataA.user.username, accountA.username, 'Account A session must resolve to Account A');
  assert.equal(dataA.user.email, accountA.email, 'Account A profile must expose only Account A identity');
  assert.equal(dataB.user.username, accountB.username, 'Account B session must resolve to Account B');
  assert.equal(dataB.user.email, accountB.email, 'Account B profile must expose only Account B identity');
  const malformedSession = await request('/api/me', {headers:{cookie:'session=%E0%A4%A'}});
  assert.equal(malformedSession.response.status, 200, 'Malformed percent-encoded session cookie must not crash the Worker');
  assert.equal(JSON.parse(malformedSession.body).user, null, 'Malformed session cookie must be treated as unauthenticated');
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
  const csrfOriginProbe = await request('/api/library', {method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie,origin:'https://attacker.example'},body:JSON.stringify({novel_id:novelId})});
  assert.equal(csrfOriginProbe.response.status, 403, 'Cross-origin state-changing requests must be rejected');
  const csrfFetchMetadataProbe = await request('/api/library', {method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie,'sec-fetch-site':'cross-site'},body:JSON.stringify({novel_id:novelId})});
  assert.equal(csrfFetchMetadataProbe.response.status, 403, 'Cross-site Fetch Metadata requests must be rejected');
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
  assert.equal(positionWrite.response.status, 200, `Account A reading-position write failed: ${positionWrite.body}\\nWorker diagnostics: ${output.slice(-12000)}`);
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

  // Ticket balances and connector import history are private financial/account records.
  const ticketFixtureSql = `INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(${dataA.user.id},1,'runtime_fixture','A-only ledger'),(${dataB.user.id},2,'runtime_fixture','B-only ledger')`;
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',ticketFixtureSql], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const ledgerA = await getAs(accountA, '/api/tickets/ledger');
  const ledgerB = await getAs(accountB, '/api/tickets/ledger');
  assert.ok(JSON.parse(ledgerA.body).some(x=>x.reference==='A-only ledger'), 'Account A must see own ticket ledger');
  assert.ok(!JSON.parse(ledgerA.body).some(x=>x.reference==='B-only ledger'), 'Account A must not see Account B ticket ledger');
  assert.ok(JSON.parse(ledgerB.body).some(x=>x.reference==='B-only ledger'), 'Account B must see own ticket ledger');
  assert.ok(!JSON.parse(ledgerB.body).some(x=>x.reference==='A-only ledger'), 'Account B must not see Account A ticket ledger');
  for(let attempt=0;attempt<5;attempt++){
    const donation=await request('/api/donations',{method:'POST',headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify({amount:10,reference_id:`runtime-donation-${suffix}-${attempt}`})});
    assert.equal(donation.response.status,200,`Donation submission ${attempt+1} must be accepted within the account limit: ${donation.body}`);
  }
  const excessDonation=await request('/api/donations',{method:'POST',headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify({amount:10,reference_id:`runtime-donation-${suffix}-excess`})});
  assert.equal(excessDonation.response.status,429,'Excess donation submissions must be throttled per account');
  assert.ok(Number(excessDonation.response.headers.get('retry-after'))>0,'Donation throttling must provide Retry-After');


  // Initialize OmniPortal tables through the real authenticated API before inserting local-only fixtures.
  const omniInitA = await getAs(accountA, '/api/omni/jobs');
  const omniInitB = await getAs(accountB, '/api/omni/jobs');
  assert.equal(omniInitA.response.status, 200, `Account A OmniPortal history failed: ${omniInitA.body}`);
  assert.equal(omniInitB.response.status, 200, `Account B OmniPortal history failed: ${omniInitB.body}`);
  const omniFixtureSql = `INSERT INTO import_jobs(user_id,source_url,status,message) VALUES(${dataA.user.id},'https://example.invalid/a','queued','A-only import'),(${dataB.user.id},'https://example.invalid/b','queued','B-only import')`;
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',omniFixtureSql], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const omniA = await getAs(accountA, '/api/omni/jobs');
  const omniB = await getAs(accountB, '/api/omni/jobs');
  assert.ok(JSON.parse(omniA.body).some(x=>x.message==='A-only import'), 'Account A must see own OmniPortal import');
  assert.ok(!JSON.parse(omniA.body).some(x=>x.message==='B-only import'), 'Account A must not see Account B OmniPortal import');
  assert.ok(JSON.parse(omniB.body).some(x=>x.message==='B-only import'), 'Account B must see own OmniPortal import');
  assert.ok(!JSON.parse(omniB.body).some(x=>x.message==='A-only import'), 'Account B must not see Account A OmniPortal import');
  const aiProjectsInitA = await getAs(accountA, '/api/author/ai/projects');
  const aiProjectsInitB = await getAs(accountB, '/api/author/ai/projects');
  assert.equal(aiProjectsInitA.response.status, 200, `Author A AI project list failed: ${aiProjectsInitA.body}`);
  assert.equal(aiProjectsInitB.response.status, 200, `Author B AI project list failed: ${aiProjectsInitB.body}`);
  const aiProjectFixtureSql = `INSERT INTO ai_author_projects(id,owner_user_id,name,mode,status) VALUES(2147483004,${dataA.user.id},'A private AI project','manual','draft'),(2147483005,${dataB.user.id},'B private AI project','manual','draft')`;
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',aiProjectFixtureSql], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const authorNovelsA = await getAs(accountA, '/api/author/novels');
  const authorNovelsB = await getAs(accountB, '/api/author/novels');
  assert.ok(JSON.parse(authorNovelsA.body).some(x=>Number(x.id)===2147483004), 'Author A must see own novel');
  assert.ok(!JSON.parse(authorNovelsA.body).some(x=>Number(x.id)===2147483005), 'Author A must not list Author B novel');
  assert.ok(JSON.parse(authorNovelsB.body).some(x=>Number(x.id)===2147483005), 'Author B must see own novel');
  assert.ok(!JSON.parse(authorNovelsB.body).some(x=>Number(x.id)===2147483004), 'Author B must not list Author A novel');
  const authorCrossPatch = await request('/api/author/novels/2147483005', {method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({title:'Compromised by A'})});
  assert.equal(authorCrossPatch.response.status, 403, 'Author A must not modify Author B novel');
  const authorCrossChapterList = await getAs(accountA, '/api/author/chapters?novel_id=2147483005');
  assert.equal(authorCrossChapterList.response.status, 403, 'Author A must not list Author B chapters');
  const authorCrossChapterPatch = await request('/api/author/chapters/2147483005', {method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({title:'Compromised chapter'})});
  assert.equal(authorCrossChapterPatch.response.status, 403, 'Author A must not modify Author B chapter');
  const aiProjectsA = JSON.parse((await getAs(accountA, '/api/author/ai/projects')).body);
  const aiProjectsB = JSON.parse((await getAs(accountB, '/api/author/ai/projects')).body);
  assert.ok(aiProjectsA.some(x=>Number(x.id)===2147483004), 'Author A must see own AI project');
  assert.ok(!aiProjectsA.some(x=>Number(x.id)===2147483005), 'Author A must not list Author B AI project');
  assert.ok(aiProjectsB.some(x=>Number(x.id)===2147483005), 'Author B must see own AI project');
  assert.ok(!aiProjectsB.some(x=>Number(x.id)===2147483004), 'Author B must not list Author A AI project');
  const aiProjectDetail = await getAs(accountA, '/api/author/ai/projects/2147483005');
  assert.equal(aiProjectDetail.response.status, 403, 'Author A must not read Author B AI project detail');
  const aiProjectPatch = await request('/api/author/ai/projects/2147483005', {method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({name:'Compromised AI project'})});
  assert.equal(aiProjectPatch.response.status, 403, 'Author A must not modify Author B AI project');

  const taxonomyPayload = {type:'tag',name:'Runtime Isolation Security Probe',description:'Local runtime-only test',creator_id:dataB.user.id,creator_name:'Forged Account B'};
  const anonymousTaxonomyPost = await request('/api/taxonomy', {method:'POST',headers:jsonHeaders,body:JSON.stringify(taxonomyPayload)});
  assert.equal(anonymousTaxonomyPost.response.status, 401, 'Anonymous taxonomy submission must be rejected');
  const taxonomyPostA = await postAs(accountA, '/api/taxonomy', taxonomyPayload);
  assert.equal(taxonomyPostA.response.status, 200, `Authenticated taxonomy submission failed: ${taxonomyPostA.body}`);
  assert.equal(JSON.parse(taxonomyPostA.body).status, 'pending', 'Taxonomy submissions must enter moderation as pending');
  const pendingTaxonomyPublic = await request('/api/taxonomy?type=tag');
  assert.ok(!pendingTaxonomyPublic.body.includes('Runtime Isolation Security Probe'), 'Pending taxonomy proposal must not appear in public taxonomy');
  const pendingTaxonomyStatusProbe = await request('/api/taxonomy?type=tag&status=pending');
  assert.equal(pendingTaxonomyStatusProbe.response.status, 403, 'Public taxonomy endpoint must reject pending status queries');
  // Administrative APIs must reject both anonymous visitors and ordinary author accounts.
  const adminReadRoutes = [
    '/api/admin/agents',
    '/api/admin/taxonomy',
    '/api/admin/community/comments',
    '/api/admin/community/reports',
    '/api/admin/stats',
    '/api/admin/users',
    '/api/admin/publishing',
    '/api/admin/donations',
    '/api/admin/reports',
    '/api/admin/connectors',
    '/api/admin/requests',
    '/api/admin/connector-authorization-requests'
  ];
  for (const route of adminReadRoutes) {
    const anonymous = await request(route);
    assert.ok([401,403].includes(anonymous.response.status), `Anonymous visitor must be denied ${route}: ${anonymous.response.status} ${anonymous.body}`);
    const ordinaryAuthor = await getAs(accountB, route);
    assert.equal(ordinaryAuthor.response.status, 403, `Ordinary author must not access ${route}: ${ordinaryAuthor.body}`);
  }
  const adminWriteRoutes = [
    ['/api/admin/agents/run','POST',{slug:'security-sentinel'}],
    ['/api/admin/taxonomy','POST',{action:'approve',id:2147483999}],
    ['/api/admin/community/comments','PATCH',{comment_id:2147483999,status:'hidden'}],
    ['/api/admin/community/reports','PATCH',{report_id:2147483999,status:'resolved'}],
    ['/api/admin/donations/2147483999','PATCH',{status:'approved'}],
    ['/api/admin/reports/2147483999','PATCH',{status:'resolved'}],
    ['/api/admin/tickets','POST',{user_id:dataB.user.id,amount:1,reason:'runtime probe'}],
    ['/api/admin/connectors','PATCH',{id:2147483999,enabled:false}],
    ['/api/admin/connectors/cleanup','POST',{}],
    ['/api/admin/requests/2147483999','PATCH',{status:'rejected'}],
    ['/api/admin/connector-authorization-requests/2147483999','PATCH',{status:'rejected'}]
  ];
  for (const [route,method,payload] of adminWriteRoutes) {
    const anonymous = await request(route,{method,headers:jsonHeaders,body:JSON.stringify(payload)});
    assert.ok([401,403].includes(anonymous.response.status), `Anonymous visitor must be denied admin write ${route}: ${anonymous.response.status} ${anonymous.body}`);
    const ordinaryAuthor = await request(route,{method,headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify(payload)});
    assert.equal(ordinaryAuthor.response.status,403, `Ordinary author must be denied admin write ${route}: ${ordinaryAuthor.response.status} ${ordinaryAuthor.body}`);
  }

  // Promote the second test account to moderator and verify least-privilege moderation access.
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`UPDATE users SET role='moderator' WHERE id=${dataB.user.id}`], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  for (const route of ['/api/admin/taxonomy','/api/admin/community/comments','/api/admin/community/reports']) {
    const moderationRead = await getAs(accountB, route);
    assert.equal(moderationRead.response.status, 200, `Moderator must access scoped moderation queue ${route}: ${moderationRead.body}`);
  }
  const moderatorTaxonomy = await getAs(accountB, '/api/admin/taxonomy');
  const moderatorTaxonomyRows = JSON.parse(moderatorTaxonomy.body);
  assert.ok(moderatorTaxonomyRows.every(row => !('creator_id' in row) && !('reviewer_id' in row)), 'Moderator taxonomy queue must not expose internal creator or reviewer account IDs');
  const moderatorReports = await getAs(accountB, '/api/admin/community/reports');
  assert.ok(JSON.parse(moderatorReports.body).every(row => !('user_id' in row)), 'Moderator report queue must not expose reporter account IDs');
  const moderatorStats = await getAs(accountB, '/api/admin/stats');
  assert.equal(moderatorStats.response.status, 403, 'Moderator must not access administrator analytics');
  const moderatorAgents = await getAs(accountB, '/api/admin/agents');
  assert.equal(moderatorAgents.response.status, 403, 'Moderator must not access administrator agent controls');
  const moderatorDirectory = await getAs(accountB, '/api/admin/users');
  assert.equal(moderatorDirectory.response.status, 403, 'Moderator must not access sensitive account directory');
  const moderatorTaxonomyWrite = await request('/api/admin/taxonomy', {method:'POST',headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify({id:2147483999,decision:'approve'})});
  assert.equal(moderatorTaxonomyWrite.response.status, 404, 'Moderator taxonomy decision must pass authorization and safely report missing submission');
  const moderatorCommentWrite = await request('/api/admin/community/comments', {method:'PATCH',headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify({comment_id:2147483999,status:'hidden'})});
  assert.equal(moderatorCommentWrite.response.status, 404, 'Moderator comment action must pass authorization and safely report missing comment');
  const moderatorReportWrite = await request('/api/admin/community/reports', {method:'PATCH',headers:{...jsonHeaders,cookie:accountB.cookie},body:JSON.stringify({report_id:2147483999,status:'resolved'})});
  assert.equal(moderatorReportWrite.response.status, 404, 'Moderator report action must pass authorization and safely report missing report');

  // In this isolated test environment the platform-owner identity is intentionally unset.
  const promoteAdminSql = `UPDATE users SET role='admin' WHERE id=${dataA.user.id}`;
  execFileSync('npx', ['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',promoteAdminSql], {stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const adminUsersRead = await getAs(accountA, '/api/admin/users');
  assert.equal(adminUsersRead.response.status, 403, 'Generic administrator must not read sensitive account directory without owner identity');
  const adminEscalation = await request(`/api/admin/users/${dataB.user.id}`, {method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({role:'admin'})});
  assert.equal(adminEscalation.response.status, 503, 'Administrator elevation must fail closed when platform-owner identity is unconfigured');
  const creditBefore=await getAs(accountB,'/api/profile');
  const startingCredits=Number(JSON.parse(creditBefore.body).user.tickets);
  const creditKey=`runtime-credit-${suffix}-once`;
  const repeatedAdminCredits=await Promise.all([
    request('/api/admin/tickets',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({user_id:dataB.user.id,amount:4,idempotency_key:creditKey})}),
    request('/api/admin/tickets',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({user_id:dataB.user.id,amount:4,idempotency_key:creditKey})})
  ]);
  assert.ok(repeatedAdminCredits.every(x=>x.response.status===200),`Repeated administrator credit operation must be safely idempotent: ${repeatedAdminCredits.map(x=>x.body).join(' | ')}`);
  assert.equal(repeatedAdminCredits.filter(x=>JSON.parse(x.body).already_applied===false).length,1,'Exactly one administrator credit request may perform the balance mutation');
  assert.equal(repeatedAdminCredits.filter(x=>JSON.parse(x.body).already_applied===true).length,1,'The repeated administrator credit request must report the existing operation');
  const creditAfter=await getAs(accountB,'/api/profile');
  assert.equal(Number(JSON.parse(creditAfter.body).user.tickets),startingCredits+4,'Repeated administrator credit requests must increase the target balance only once');
  const creditLedger=await getAs(accountB,'/api/tickets/ledger');
  assert.equal(JSON.parse(creditLedger.body).filter(x=>x.reason==='admin_adjustment'&&x.reference===`admin:${dataA.user.id}:${creditKey}`&&Number(x.delta)===4).length,1,'Repeated administrator credit requests must create exactly one matching ledger entry');
  const reusedCreditKey=await request('/api/admin/tickets',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({user_id:dataB.user.id,amount:5,idempotency_key:creditKey})});
  assert.equal(reusedCreditKey.response.status,409,'An operation key reused with a different credit amount must be rejected');
  const afterMismatchedCredit=await getAs(accountB,'/api/profile');
  assert.equal(Number(JSON.parse(afterMismatchedCredit.body).user.tickets),startingCredits+4,'Mismatched idempotency-key reuse must not change the balance');

  const approvalReference=`runtime-approval-${suffix}`;
  const paymentSubmission=await request('/api/donations',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({amount:10,reference_id:approvalReference})});
  assert.equal(paymentSubmission.response.status,200,`Admin account donation fixture must submit: ${paymentSubmission.body}`);
  const adminDonationQueue=await getAs(accountA,'/api/admin/donations');
  const pendingDonation=JSON.parse(adminDonationQueue.body).find(x=>x.reference_id===approvalReference);
  assert.ok(pendingDonation?.id,'Submitted payment must appear in the admin review queue');
  const duplicateApprovals=await Promise.all([
    request(`/api/admin/donations/${pendingDonation.id}`,{method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({status:'approved',tickets:10})}),
    request(`/api/admin/donations/${pendingDonation.id}`,{method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({status:'approved',tickets:10})})
  ]);
  assert.equal(duplicateApprovals.filter(x=>x.response.status===200).length,1,'Exactly one concurrent donation approval may succeed');
  assert.equal(duplicateApprovals.filter(x=>x.response.status===409).length,1,'Duplicate concurrent donation approval must be rejected');
  const afterApprovalProfile=await getAs(accountA,'/api/profile');
  assert.equal(Number(JSON.parse(afterApprovalProfile.body).user.tickets),17,'Concurrent duplicate donation approval must credit the account exactly once');
  const afterApprovalLedger=await getAs(accountA,'/api/tickets/ledger');
  assert.equal(JSON.parse(afterApprovalLedger.body).filter(x=>x.reason==='payment'&&x.reference===String(pendingDonation.id)&&Number(x.delta)===10).length,1,'Concurrent duplicate donation approval must create exactly one payment ledger entry');
  const approvalAudit=execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`SELECT action,details FROM audit_logs WHERE action='donation_approved' AND details LIKE '%donation=${pendingDonation.id};%' LIMIT 1`],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1'}});
  assert.match(approvalAudit,/donation_approved/,'Successful payment approval must leave an administrator audit record');
  assert.match(approvalAudit,new RegExp('donation='+pendingDonation.id),'Payment audit record must identify the donation');

  const rejectionReference=`runtime-rejection-${suffix}`;
  const rejectionSubmission=await request('/api/donations',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({amount:5,reference_id:rejectionReference})});
  assert.equal(rejectionSubmission.response.status,200,`Rejection fixture must submit: ${rejectionSubmission.body}`);
  const rejectionQueue=await getAs(accountA,'/api/admin/donations');
  const rejectedDonation=JSON.parse(rejectionQueue.body).find(x=>x.reference_id===rejectionReference);
  assert.ok(rejectedDonation?.id,'Rejection fixture must appear in admin queue');
  const balanceBeforeRejection=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.tickets);
  const rejectResult=await request(`/api/admin/donations/${rejectedDonation.id}`,{method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({status:'rejected'})});
  assert.equal(rejectResult.response.status,200,`Pending donation rejection must succeed: ${rejectResult.body}`);
  const balanceAfterRejection=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.tickets);
  assert.equal(balanceAfterRejection,balanceBeforeRejection,'Rejected donation must never credit Crowns');
  const ledgerAfterRejection=await getAs(accountA,'/api/tickets/ledger');
  assert.equal(JSON.parse(ledgerAfterRejection.body).filter(x=>x.reason==='payment'&&x.reference===String(rejectedDonation.id)).length,0,'Rejected donation must not create a payment ledger entry');
  const rejectionAudit=execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`SELECT action,details FROM audit_logs WHERE action='donation_rejected' AND details LIKE '%donation=${rejectedDonation.id}%' LIMIT 1`],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1'}});
  assert.match(rejectionAudit,/donation_rejected/,'Donation rejection must leave an administrator audit record');

  // Exercise the paid request lifecycle against the real local Worker and local D1.
  // The first three requests in a week are free; the fourth costs 100 Crowns.
  const accountAId=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.id);
  execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`UPDATE users SET tickets=250 WHERE id=${accountAId}; DELETE FROM novel_requests WHERE user_id=${accountAId} AND week_key=${Math.floor(Date.now()/604800000)}`],{stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const requestIds=[];
  for(let requestIndex=1;requestIndex<=4;requestIndex++){
    const createdRequest=await request('/api/requests',{method:'POST',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({url:`https://fanqienovel.com/page/runtime-${suffix}-${requestIndex}`})});
    assert.equal(createdRequest.response.status,200,`Novel request ${requestIndex} must be created: ${createdRequest.body}`);
    const createdData=JSON.parse(createdRequest.body);
    assert.ok(Number.isSafeInteger(Number(createdData.request_id))&&Number(createdData.request_id)>0,'Novel request must return its persisted identifier');
    assert.equal(Number(createdData.cost),requestIndex<=3?0:100,`Novel request ${requestIndex} must use server-calculated weekly pricing`);
    requestIds.push(Number(createdData.request_id));
  }
  const requestLedger=await getAs(accountA,'/api/tickets/ledger');
  assert.equal(JSON.parse(requestLedger.body).filter(x=>x.reason==='novel_request'&&x.reference===String(requestIds[3])&&Number(x.delta)===-100).length,1,'Fourth weekly novel request must create exactly one stable-ID debit ledger row');
  const afterRequestCharge=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.tickets);
  assert.equal(afterRequestCharge,150,'Fourth weekly novel request must debit 100 Crowns exactly once');
  const rejectPaidRequest=await request(`/api/admin/requests/${requestIds[3]}`,{method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({status:'rejected'})});
  assert.equal(rejectPaidRequest.response.status,200,`Rejecting a paid novel request must refund it: ${rejectPaidRequest.body}`);
  assert.equal(Number(JSON.parse(rejectPaidRequest.body).refunded),100,'Rejected paid request must report the exact refund');
  const afterRequestRefund=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.tickets);
  assert.equal(afterRequestRefund,250,'Rejected paid request must restore the Crown balance exactly once');
  const refundLedger=await getAs(accountA,'/api/tickets/ledger');
  assert.equal(JSON.parse(refundLedger.body).filter(x=>x.reason==='novel_request_refund'&&x.reference===String(requestIds[3])&&Number(x.delta)===100).length,1,'Rejected paid request must create exactly one stable-ID refund ledger row');
  const duplicateRefund=await request(`/api/admin/requests/${requestIds[3]}`,{method:'PATCH',headers:{...jsonHeaders,cookie:accountA.cookie},body:JSON.stringify({status:'rejected'})});
  assert.equal(duplicateRefund.response.status,200,'Repeated rejection must be handled idempotently without another refund');
  assert.equal(JSON.parse(duplicateRefund.body).refunded,undefined,'Repeated rejection must not report a second refund');
  const afterDuplicateRefund=Number(JSON.parse((await getAs(accountA,'/api/profile')).body).user.tickets);
  assert.equal(afterDuplicateRefund,250,'Repeated request rejection must never duplicate a refund');
  const refundAudit=execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`SELECT action,details FROM audit_logs WHERE action='admin_request_rejected' AND details LIKE '%request=${requestIds[3]};%' LIMIT 1`],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1'}});
  assert.match(refundAudit,/admin_request_rejected/,'Paid request refund must leave an administrator audit record');

  // Account export is a private, account-scoped download. Seed distinct progress rows
  // for both test accounts and prove neither export crosses the ownership boundary.
  const accountBId=Number(JSON.parse((await getAs(accountB,'/api/profile')).body).user.id);
  execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`DELETE FROM reading_positions WHERE user_id IN (${accountAId},${accountBId}) AND novel_id=2147483998; INSERT INTO reading_positions(user_id,novel_id,chapter_number,progress_percent) VALUES(${accountAId},2147483998,7,37),(${accountBId},2147483998,8,82)`],{stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const exportA=await request('/api/privacy/export',{headers:{cookie:accountA.cookie}});
  assert.equal(exportA.response.status,200,`Authenticated account data export must succeed: ${exportA.body}`);
  assert.match(exportA.response.headers.get('content-disposition')||'',/attachment; filename="imperial-novel-account-data.json"/,'Account export must download as a JSON attachment');
  assert.match(exportA.response.headers.get('cache-control')||'',/no-store/,'Account export must not be cached');
  assert.equal(exportA.response.headers.get('vary'),'Cookie','Account export must vary by session cookie');
  const exportAData=JSON.parse(exportA.body);
  assert.equal(exportAData.account.username,accountA.username,'Export must identify only the signed-in account');
  assert.ok(Number.isFinite(exportAData.account.tickets),'Account export must include the signed-in account Crown balance');
  assert.ok(exportAData.collections.authored_novels.some(x=>x.id===2147483004),'Author export must include the signed-in account\'s own draft novel');
  assert.ok(!exportAData.collections.authored_novels.some(x=>x.id===2147483005),'Author export must not include another account\'s novel');
  assert.ok(Number.isFinite(Date.parse(exportAData.generated_at)),'Export timestamp must be a valid ISO date');
  assert.deepEqual(exportAData.collections.reading_positions.filter(x=>x.novel_id===2147483998).map(x=>x.progress_percent),[37],'Account A export must contain Account A reading progress only for the isolated fixture');
  assert.ok(!exportAData.collections.reading_positions.some(x=>x.novel_id===2147483998&&x.progress_percent===82),'Account A export must not include Account B reading progress');
  assert.ok(!exportA.body.includes(accountB.email),'Account A export must not disclose Account B email');
  assert.ok(!exportA.body.includes('password_hash')&&!exportA.body.includes('token_hash'),'Account export must never include password hashes or session token hashes');
  const exportASecond=await request('/api/privacy/export',{headers:{cookie:accountA.cookie}});
  assert.equal(exportASecond.response.status,200,'Second account export within the hourly allowance must succeed');
  const exportAThird=await request('/api/privacy/export',{headers:{cookie:accountA.cookie}});
  assert.equal(exportAThird.response.status,200,'Third account export within the hourly allowance must succeed');
  const exportAFourth=await request('/api/privacy/export',{headers:{cookie:accountA.cookie}});
  assert.equal(exportAFourth.response.status,429,'Account export must be rate-limited after three requests per hour');
  assert.ok(Number(exportAFourth.response.headers.get('retry-after')||0)>0,'Rate-limited export must include Retry-After');
  const exportB=await request('/api/privacy/export',{headers:{cookie:accountB.cookie}});
  assert.equal(exportB.response.status,200,'Account B must be able to export its own data');
  assert.deepEqual(JSON.parse(exportB.body).collections.reading_positions.map(x=>x.progress_percent),[82],'Account B export must contain Account B reading progress only');
  const badClosure=await request('/api/account/closure-request',{method:'POST',headers:{cookie:accountB.cookie,'content-type':'application/json'},body:JSON.stringify({password:'definitely-not-the-account-password'})});
  assert.equal(badClosure.response.status,403,'Account closure must require the correct current password');
  const closure=await request('/api/account/closure-request',{method:'POST',headers:{cookie:accountB.cookie,'content-type':'application/json'},body:JSON.stringify({password:accountB.password})});
  assert.equal(closure.response.status,200,`Correct password must create a closure request: ${closure.body}`);
  const closureData=JSON.parse(closure.body);
  assert.equal(closureData.grace_period_days,14,'Account closure must provide a 14-day cancellation window');
  assert.equal(closureData.request.status,'pending','New account closure request must be pending');
  assert.ok(closureData.request.grace_until>closureData.request.requested_at,'Closure grace deadline must be after request time');
  const duplicateClosure=await request('/api/account/closure-request',{method:'POST',headers:{cookie:accountB.cookie,'content-type':'application/json'},body:JSON.stringify({password:accountB.password})});
  assert.equal(duplicateClosure.response.status,200,'Repeated closure request must be idempotent');
  assert.equal(JSON.parse(duplicateClosure.body).already_requested,true,'Repeated closure request must reuse the pending request');
  const closureStatus=await request('/api/account/closure-request',{headers:{cookie:accountB.cookie}});
  assert.equal(JSON.parse(closureStatus.body).request.id,closureData.request.id,'Account closure status must be scoped to the signed-in user');
  const otherAccountClosureStatus=await request('/api/account/closure-request',{headers:{cookie:accountA.cookie}});
  assert.equal(otherAccountClosureStatus.response.status,200,'Other signed-in accounts may inspect their own closure status');
  assert.equal(JSON.parse(otherAccountClosureStatus.body).request,null,'An account must not see another account closure request');
  const anonymousClosureStatus=await request('/api/account/closure-request');
  assert.equal(anonymousClosureStatus.response.status,401,'Anonymous visitors must not inspect account closure status');
  const cancelledClosure=await request('/api/account/closure-cancel',{method:'POST',headers:{cookie:accountB.cookie}});
  assert.equal(cancelledClosure.response.status,200,'Account must be able to cancel closure during the grace period');
  assert.equal(JSON.parse(cancelledClosure.body).cancelled,true,'Cancellation must change the pending request');
  const repeatedCancel=await request('/api/account/closure-cancel',{method:'POST',headers:{cookie:accountB.cookie}});
  assert.equal(repeatedCancel.response.status,409,'Repeated cancellation without a pending request must not mutate state');
  const afterCancel=await request('/api/account/closure-request',{headers:{cookie:accountB.cookie}});
  assert.equal(JSON.parse(afterCancel.body).request.status,'cancelled','Closure status must show the cancellation');
  const exportAfterClosure=await request('/api/privacy/export',{headers:{cookie:accountB.cookie}});
  assert.equal(exportAfterClosure.response.status,200,'Account data export must remain available after a cancelled closure request');
  assert.ok(JSON.parse(exportAfterClosure.body).collections.account_closure_requests.some(x=>x.id===closureData.request.id&&x.status==='cancelled'),'Account export must include only the account closure history belonging to that account');
  const accountAfterCancel=await request('/api/profile',{headers:{cookie:accountB.cookie}});
  assert.equal(accountAfterCancel.response.status,200,'Cancelling closure must preserve the account and its active session');
  const closureAudit=execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',`SELECT action FROM audit_logs WHERE user_id=${accountBId} AND action IN ('account_closure_requested','account_closure_cancelled') ORDER BY id DESC LIMIT 2`],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1'}});
  assert.match(closureAudit,/account_closure_requested/,'Closure request must create an audit event');
  assert.match(closureAudit,/account_closure_cancelled/,'Closure cancellation must create an audit event');

  const anonymousExport=await request('/api/privacy/export');
  assert.equal(anonymousExport.response.status,401,'Anonymous visitors must not export account data');

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
  const logout = await request('/api/auth/logout', {method:'POST',headers:{cookie:accountA.cookie}});
  assert.equal(logout.response.status, 200, 'Authenticated logout must complete successfully');
  assert.match(logout.response.headers.get('set-cookie')||'', /Max-Age=0/, 'Logout must expire the browser session cookie');
  const revokedSession = await getAs(accountA, '/api/me');
  assert.equal(JSON.parse(revokedSession.body).user, null, 'A logged-out session token must no longer authenticate subsequent requests');
  const secondLogin = await request('/api/auth/login', {method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountA.email,password:accountA.password})});
  assert.equal(secondLogin.response.status,200,'Second-device login must succeed for the session revocation test');
  const secondCookie = (secondLogin.response.headers.get('set-cookie')||'').split(';',1)[0];
  assert.match(secondCookie,/^session=.+$/,'Second-device login must issue a separate session');
  const logoutAll = await request('/api/auth/logout-all',{method:'POST',headers:{cookie:secondCookie}});
  assert.equal(logoutAll.response.status,200,'Authenticated logout-all must revoke every account session');
  assert.match(logoutAll.response.headers.get('set-cookie')||'',/Max-Age=0/,'Logout-all must expire the current browser cookie');
  const firstDeviceAfterRevoke = await getAs(accountA,'/api/me');
  assert.equal(JSON.parse(firstDeviceAfterRevoke.body).user,null,'Logout-all must revoke the first device session');
  const secondDeviceAfterRevoke = await request('/api/me',{headers:{cookie:secondCookie}});
  assert.equal(JSON.parse(secondDeviceAfterRevoke.body).user,null,'Logout-all must revoke the second device session');
  for(let attempt=0;attempt<10;attempt++){
    const failedLogin=await request('/api/auth/login',{method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountB.email,password:'Definitely-Wrong-Password!'})});
    assert.equal(failedLogin.response.status,401,`Invalid credentials must be rejected before the email threshold (attempt ${attempt+1})`);
  }
  const throttledLogin=await request('/api/auth/login',{method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountB.email,password:accountB.password})});
  assert.equal(throttledLogin.response.status,429,'Repeated failed login attempts must trigger account-keyed throttling');
  assert.ok(Number(throttledLogin.response.headers.get('retry-after'))>0,'Login throttling must provide a positive Retry-After interval');
  execFileSync('npx',['--yes','wrangler@4','d1','execute','god-emperornovel-db','--local','--persist-to','.wrangler/test-runtime','--command',"DELETE FROM auth_rate_limits WHERE scope='login-email'"],{stdio:'pipe',env:{...process.env,NO_COLOR:'1'}});
  const secondBLogin=await request('/api/auth/login',{method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountB.email,password:accountB.password})});
  assert.equal(secondBLogin.response.status,200,'An active account must be able to create a second device session before ban testing');
  const secondBCookie=(secondBLogin.response.headers.get('set-cookie')||'').split(';',1)[0];
  assert.match(secondBCookie,/^session=.+$/,'Second account device must receive a session');
  const adminRelogin=await request('/api/auth/login',{method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountA.email,password:accountA.password})});
  assert.equal(adminRelogin.response.status,200,'Administrator must be able to sign in before the ban test');
  const adminCookie=(adminRelogin.response.headers.get('set-cookie')||'').split(';',1)[0];
  const banAccount=await request(`/api/admin/users/${dataB.user.id}`,{method:'PATCH',headers:{...jsonHeaders,cookie:adminCookie},body:JSON.stringify({banned:true,verified:true})});
  assert.equal(banAccount.response.status,200,`Administrator ban action must succeed: ${banAccount.body}`);
  assert.equal(JSON.parse(banAccount.body).sessions_revoked,true,'Ban response must confirm immediate session revocation');
  const firstBDevice=await request('/api/me',{headers:{cookie:accountB.cookie}});
  const secondBDevice=await request('/api/me',{headers:{cookie:secondBCookie}});
  assert.equal(JSON.parse(firstBDevice.body).user,null,'Banning an account must revoke its original device session');
  assert.equal(JSON.parse(secondBDevice.body).user,null,'Banning an account must revoke every additional device session');
  const bannedLogin=await request('/api/auth/login',{method:'POST',headers:jsonHeaders,body:JSON.stringify({email:accountB.email,password:accountB.password})});
  assert.equal(bannedLogin.response.status,403,'A banned account with a correct password must not receive a new session');
  assert.match(bannedLogin.body,/disabled/i,'Banned login response must explain that the account is disabled');



  console.log('PASS: real Wrangler local Worker handled health, D1-backed catalog, live overview, authenticated taxonomy submission identity boundary and unauthenticated taxonomy rejection, missing chapter, two independent account registrations/logins, session-bound profile isolation, cross-account library/history/bookmark/reading-position/notification, ticket-ledger, OmniPortal-import and author-owned novel/chapter/AI-project isolation, hostile user_id write/query handling, owner/admin privilege-boundary rejection and anonymous private-resource rejection and homepage requests.');
} finally {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(5000)]);
}
