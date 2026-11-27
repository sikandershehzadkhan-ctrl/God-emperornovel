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
    method: "POST", body: { username, email, password }
  });
  assert.equal(registration.response.status, 200, `registration failed: ${JSON.stringify(registration.data)}`);
  const login = await request("/api/auth/login", {
    method: "POST", body: { email, password }
  });
  assert.equal(login.response.status, 200, `login failed: ${JSON.stringify(login.data)}`);
  const setCookie = login.response.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  assert.match(cookie, /^session=/, "login must issue a session cookie");
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

console.log("PASS: isolated local Worker runtime enforces account-scoped reading history, ignores client user_id spoofing, rejects anonymous access, and blocks cross-origin mutations.");
