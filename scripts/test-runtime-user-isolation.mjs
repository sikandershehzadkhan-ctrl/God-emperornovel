import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const base = (process.env.IMPERIAL_TEST_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const origin = base;
const headers = { origin, "sec-fetch-site": "same-origin", "content-type": "application/json" };
const fixtureNovelId = 987654321;

async function request(path, { method = "GET", body, cookie } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...headers, ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

async function registerAndLogin(suffix) {
  const username = `isolation_${suffix}`;
  const email = `${username}@example.invalid`;
  const password = "Runtime-Isolation-Only-2026!";
  const registration = await request("/api/auth/register", {
    method: "POST", body: { username, email, password, role: "admin" }
  });
  assert.equal(registration.response.status, 200, `registration failed: ${JSON.stringify(registration.data)}`);
  const login = await request("/api/auth/login", {
    method: "POST", body: { email, password }
  });
  assert.equal(login.response.status, 200, `login failed: ${JSON.stringify(login.data)}`);
  const setCookie = login.response.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  assert.match(cookie, /^session=/, "login must issue a session cookie");
  assert.equal(login.data.user.role, "user", "registration must ignore client-supplied administrator roles");
  return { cookie, user: login.data.user };
}

const a = await registerAndLogin("alpha");
const b = await registerAndLogin("bravo");
assert.notEqual(a.user.id, b.user.id, "test accounts must be distinct");

// Promote only these throwaway local fixtures, never production accounts.
execFileSync("npx", [
  "--yes", "wrangler@4", "d1", "execute", "god-emperornovel-db",
  "--local", "--config", "wrangler.toml",
  "--command", "UPDATE users SET role='author' WHERE username IN ('isolation_alpha','isolation_bravo')"
], { stdio: "pipe" });

const aNovels = await request("/api/author/novels", { cookie: a.cookie });
const bNovels = await request("/api/author/novels", { cookie: b.cookie });
assert.equal(aNovels.response.status, 200);
assert.equal(bNovels.response.status, 200);
assert.deepEqual(aNovels.data, []);
assert.deepEqual(bNovels.data, []);

const createNovel = await request("/api/author/novels", {
  method: "POST",
  cookie: a.cookie,
  body: { title: "Runtime Ownership Fixture", author: "Isolation Test", rights_status: "original" }
});
assert.equal(createNovel.response.status, 201, `author A could not create fixture novel: ${JSON.stringify(createNovel.data)}`);
const privateNovelId = Number(createNovel.data.id);
assert.ok(Number.isSafeInteger(privateNovelId) && privateNovelId > 0, "created novel must have a valid ID");

const aOwnNovels = await request("/api/author/novels", { cookie: a.cookie });
const bCannotListNovel = await request("/api/author/novels", { cookie: b.cookie });
assert.ok(aOwnNovels.data.some(n => Number(n.id) === privateNovelId), "author A must see its own novel");
assert.ok(!bCannotListNovel.data.some(n => Number(n.id) === privateNovelId), "author B must not list A's private novel");

const bPatchForeignNovel = await request("/api/author/novels/" + privateNovelId, {
  method: "PATCH", cookie: b.cookie, body: { title: "Unauthorized takeover attempt" }
});
assert.equal(bPatchForeignNovel.response.status, 403, "author B must not edit author A's novel by swapping its ID");

const createChapter = await request("/api/author/chapters", {
  method: "POST", cookie: a.cookie,
  body: { novel_id: privateNovelId, chapter_number: 1, title: "Alpha private chapter", content: "<p>Private chapter fixture content.</p>" }
});
assert.equal(createChapter.response.status, 201, `author A could not create chapter: ${JSON.stringify(createChapter.data)}`);
const privateChapterId = Number(createChapter.data.id);
assert.ok(Number.isSafeInteger(privateChapterId) && privateChapterId > 0);
const aChapters = await request("/api/author/chapters?novel_id=" + privateNovelId, { cookie: a.cookie });
assert.equal(aChapters.response.status, 200);
assert.ok(aChapters.data.some(c => Number(c.id) === privateChapterId));
const bChapterList = await request("/api/author/chapters?novel_id=" + privateNovelId, { cookie: b.cookie });
assert.equal(bChapterList.response.status, 403, "author B must not list A's chapters");
const bChapterPatch = await request("/api/author/chapters/" + privateChapterId, {
  method: "PATCH", cookie: b.cookie, body: { title: "Unauthorized chapter takeover" }
});
assert.equal(bChapterPatch.response.status, 403, "author B must not edit A's chapter by swapping its ID");
const bChapterPublish = await request("/api/author/chapters/" + privateChapterId + "/publish", {
  method: "POST", cookie: b.cookie, body: { publication_status: "published" }
});
assert.equal(bChapterPublish.response.status, 403, "author B must not publish A's chapter by swapping its ID");

const nonAdminRoleEscalation = await request("/api/admin/users/" + b.user.id, {
  method: "PATCH", cookie: b.cookie, body: { role: "admin", verified: true, banned: false }
});
assert.equal(nonAdminRoleEscalation.response.status, 403, "an author must not promote accounts through admin endpoints");

// This fixture exists only in Wrangler's disposable local D1 database.
const write = await request("/api/history", {
  method: "POST",
  cookie: a.cookie,
  body: { novel_id: fixtureNovelId, chapter_number: 7, user_id: b.user.id }
});
assert.equal(write.response.status, 200, `owner history write failed: ${JSON.stringify(write.data)}`);

const aHistory = await request("/api/history", { cookie: a.cookie });
const bHistory = await request("/api/history?user_id=" + a.user.id, { cookie: b.cookie });
assert.equal(aHistory.response.status, 200);
assert.equal(bHistory.response.status, 200);
assert.ok(Array.isArray(aHistory.data) && Array.isArray(bHistory.data), "history responses must be arrays");
assert.equal(aHistory.data.length, 1, "account A must see its own history entry");
assert.equal(Number(aHistory.data[0].novel_id), fixtureNovelId);
assert.equal(Number(aHistory.data[0].chapter_number), 7);
assert.equal(bHistory.data.length, 0, "account B must not see A's history, even when requesting A's user_id");

const anonymous = await request("/api/history", { method: "GET" });
assert.equal(anonymous.response.status, 401, "private history must reject anonymous requests");

const crossOrigin = await fetch(base + "/api/history", {
  method: "POST",
  headers: { origin: "https://attacker.invalid", "sec-fetch-site": "cross-site", "content-type": "application/json" },
  body: JSON.stringify({ novel_id: fixtureNovelId, chapter_number: 99, user_id: b.user.id })
});
assert.equal(crossOrigin.status, 403, "cross-origin API mutations must be rejected before reaching private handlers");


const localSql = sql => execFileSync("npx", [
  "--yes", "wrangler@4", "d1", "execute", "god-emperornovel-db",
  "--local", "--config", "wrangler.toml", "--command", sql
], { stdio: "pipe" });

// Seed account-owned records directly into disposable local D1 so these tests
// exercise the real Worker read/update handlers without relying on UI flows.
const aid = Number(a.user.id), bid = Number(b.user.id);
localSql(`
  INSERT INTO bookmarks(user_id,novel_id,chapter_number) VALUES(${aid},${fixtureNovelId},7),(${bid},${fixtureNovelId},3);
  INSERT INTO user_library(user_id,novel_id) VALUES(${aid},${fixtureNovelId}),(${bid},${fixtureNovelId});
  INSERT INTO notifications(id,user_id,title,body) VALUES
    (987654331,${aid},'Alpha private notice','Alpha only'),
    (987654332,${bid},'Bravo private notice','Bravo only');
  INSERT INTO ticket_ledger(id,user_id,delta,reason,reference) VALUES
    (987654341,${aid},10,'runtime fixture','alpha'),
    (987654342,${bid},20,'runtime fixture','bravo');
`);

const aBookmarks = await request("/api/bookmarks", { cookie: a.cookie });
const bBookmarks = await request("/api/bookmarks", { cookie: b.cookie });
assert.equal(aBookmarks.response.status, 200);
assert.equal(bBookmarks.response.status, 200);
assert.equal(aBookmarks.data.length, 1);
assert.equal(bBookmarks.data.length, 1);
assert.equal(Number(aBookmarks.data[0].chapter_number), 7);
assert.equal(Number(bBookmarks.data[0].chapter_number), 3);

const aLibrary = await request("/api/library", { cookie: a.cookie });
const bLibrary = await request("/api/library", { cookie: b.cookie });
assert.equal(aLibrary.response.status, 200);
assert.equal(bLibrary.response.status, 200);
assert.equal(aLibrary.data.length, 1);
assert.equal(bLibrary.data.length, 1);
assert.equal(Number(aLibrary.data[0].novel_id), fixtureNovelId);
assert.equal(Number(bLibrary.data[0].novel_id), fixtureNovelId);

const aNotifications = await request("/api/notifications", { cookie: a.cookie });
const bNotifications = await request("/api/notifications", { cookie: b.cookie });
assert.equal(aNotifications.response.status, 200);
assert.equal(bNotifications.response.status, 200);
assert.deepEqual(aNotifications.data.map(n => n.title), ["Alpha private notice"]);
assert.deepEqual(bNotifications.data.map(n => n.title), ["Bravo private notice"]);
const markARead = await request("/api/notifications/read", { method: "POST", cookie: a.cookie, body: {} });
assert.equal(markARead.response.status, 200);
const aNoticeState = await request("/api/notifications", { cookie: a.cookie });
const bNoticeState = await request("/api/notifications", { cookie: b.cookie });
assert.ok(aNoticeState.data[0].read_at, "A may mark only A's notifications read");
assert.equal(bNoticeState.data[0].read_at, null, "A must not mark B's notifications read");

const aLedger = await request("/api/tickets/ledger", { cookie: a.cookie });
const bLedger = await request("/api/tickets/ledger", { cookie: b.cookie });
assert.equal(aLedger.response.status, 200);
assert.equal(bLedger.response.status, 200);
assert.deepEqual(aLedger.data.map(x => x.reference), ["alpha"]);
assert.deepEqual(bLedger.data.map(x => x.reference), ["bravo"]);

// Initialize the real AI project tables, then seed two isolated project owners.
await request("/api/author/ai/projects", { cookie: a.cookie });
await request("/api/author/ai/projects", { cookie: b.cookie });
localSql(`
  INSERT INTO ai_author_projects(id,owner_user_id,name) VALUES
    (987654351,${aid},'Alpha private AI project'),
    (987654352,${bid},'Bravo private AI project');
`);
const aProjects = await request("/api/author/ai/projects", { cookie: a.cookie });
const bProjects = await request("/api/author/ai/projects", { cookie: b.cookie });
assert.ok(aProjects.data.some(p => Number(p.id) === 987654351));
assert.ok(!aProjects.data.some(p => Number(p.id) === 987654352));
assert.ok(bProjects.data.some(p => Number(p.id) === 987654352));
assert.ok(!bProjects.data.some(p => Number(p.id) === 987654351));
const aProjectDetail = await request("/api/author/ai/projects/987654351", { cookie: a.cookie });
assert.equal(aProjectDetail.response.status, 200);
const bProjectRead = await request("/api/author/ai/projects/987654351", { cookie: b.cookie });
assert.equal(bProjectRead.response.status, 403, "author B must not read author A's AI project by swapping its ID");
const bProjectPatch = await request("/api/author/ai/projects/987654351", {
  method: "PATCH", cookie: b.cookie, body: { name: "Unauthorized AI project takeover" }
});
assert.equal(bProjectPatch.response.status, 403, "author B must not modify author A's AI project by swapping its ID");

console.log("PASS: isolated local Worker runtime enforces account-scoped history and author-novel ownership, rejects ID-swapping edits and non-admin role escalation, ignores registration role injection and client user_id spoofing, rejects anonymous access, and blocks cross-origin mutations, isolates bookmarks, library, notifications, ticket ledgers, and AI author projects, and rejects cross-account AI project reads and edits, chapter listing, chapter edits, and chapter publishing.");
