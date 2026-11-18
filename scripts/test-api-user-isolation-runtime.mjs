import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);

const accounts = new Map([
  ["reader-a-token", { id: 101, username: "reader_a", email: "a@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["reader-b-token", { id: 202, username: "reader_b", email: "b@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["author-token", { id: 303, username: "author_user", email: "author@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["admin-token", { id: 404, username: "admin_user", email: "admin@example.test", role: "admin", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of accounts) sessions.set(await hash(token), user);
const history = [];
const recommendations = [
  { user_id: 101, novel_id: 10, reason: "Matches Account A reading history", score: 91 },
  { user_id: 202, novel_id: 20, reason: "Matches Account B reading history", score: 87 },
];
const requestWeek = Math.floor(now / 604800);
const novelRequests = [
  { user_id: 101, week_key: requestWeek },
  { user_id: 101, week_key: requestWeek },
  { user_id: 202, week_key: requestWeek },
];
const ticketLedger = [
  { id: 11, user_id: 101, delta: 25, reason: "purchase", reference: "A-ORDER" },
  { id: 22, user_id: 202, delta: 10, reason: "purchase", reference: "B-ORDER" },
];
const authorApplications = [
  { id: 31, user_id: 101, display_name: "Author A", status: "pending", preferred_formats: "[]" },
];
const library = [{ user_id: 101, novel_id: 10 }];
const follows = [{ user_id: 101, novel_id: 10 }];
const notifications = [
  { id: 1, user_id: 101, message: "Account A private notification", read_at: null },
  { id: 2, user_id: 202, message: "Account B private notification", read_at: null },
];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT 1 FROM novels WHERE id=?")) return Number(this.values[0]) === 10 ? { ok: 1 } : null;
    if (this.sql.includes("SELECT 1 FROM follows WHERE user_id=? AND novel_id=?")) return follows.some(row => row.user_id === this.values[0] && row.novel_id === this.values[1]) ? { ok: 1 } : null;
    if (this.sql.includes("FROM author_applications WHERE user_id=?")) return authorApplications.find(row => row.user_id === this.values[0]) || null;
    if (this.sql.includes("SELECT COUNT(*) n FROM novel_requests WHERE user_id=? AND week_key=?")) return { n: novelRequests.filter(row => row.user_id === this.values[0] && row.week_key === this.values[1]).length };
    return null;
  }
  async all() {
    if (this.sql.includes("FROM recommendations r JOIN novels n")) {
      const userId = this.values[0];
      return { results: recommendations.filter(row => row.user_id === userId).map(row => ({
        id: row.novel_id, title: "Recommended Novel " + row.novel_id, alt_titles: "",
        author: "Test Author", description: "Rights-cleared test novel", status: "ongoing",
        kind: "novel", language: "English", cover_url: "", rights_status: "original",
        views: 100, rating: 8, publication_status: "published", genres: "Fantasy",
        tags: "System", chapter_count: 4, latest_chapter: 4, reason: row.reason, score: row.score
      })) };
    }
    if (this.sql.includes("FROM history h JOIN novels n")) {
      const userId = this.values[0];
      return { results: history.filter(row => row.user_id === userId).map(row => ({
        novel_id: row.novel_id,
        chapter_number: row.chapter_number,
        updated_at: "2026-11-18 00:00:00",
        title: "Test Novel",
        author: "Test Author",
        cover_url: ""
      })) };
    }
    if (this.sql.includes("FROM user_library l JOIN novels n")) {
      const userId = this.values[0];
      return { results: library.filter(row => row.user_id === userId).map(row => ({
        novel_id: row.novel_id, title: "Test Novel", author: "Test Author"
      })) };
    }
    if (this.sql.includes("FROM follows f JOIN novels n")) {
      const userId = this.values[0];
      return { results: follows.filter(row => row.user_id === userId).map(row => ({ id: row.novel_id, title: "Test Novel", author: "Test Author" })) };
    }
    if (this.sql.includes("FROM ticket_ledger WHERE user_id=?")) {
      const userId = this.values[0];
      return { results: ticketLedger.filter(row => row.user_id === userId).map(({ id, delta, reason, reference }) => ({ id, delta, reason, reference, created_at: "2026-11-18 00:00:00" })) };
    }
    if (this.sql.includes("FROM notifications WHERE user_id=?")) {
      const userId = this.values[0];
      return { results: notifications.filter(row => row.user_id === userId).map(row => ({ ...row })) };
    }
    return { results: [] };
  }
  async run() {
    if (this.sql.includes("INSERT INTO history(user_id,novel_id,chapter_number)")) {
      const [user_id, novel_id, chapter_number] = this.values;
      const existing = history.find(row => row.user_id === user_id && row.novel_id === novel_id);
      if (existing) existing.chapter_number = chapter_number;
      else history.push({ user_id, novel_id, chapter_number });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.includes("DELETE FROM follows WHERE user_id=? AND novel_id=?")) {
      const index = follows.findIndex(row => row.user_id === this.values[0] && row.novel_id === this.values[1]);
      if (index >= 0) follows.splice(index, 1);
      return { success: true, meta: { changes: index >= 0 ? 1 : 0 } };
    }
    if (this.sql.includes("INSERT OR IGNORE INTO follows(user_id,novel_id)")) {
      const [user_id, novel_id] = this.values;
      if (!follows.some(row => row.user_id === user_id && row.novel_id === novel_id)) follows.push({ user_id, novel_id });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.includes("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL")) {
      const userId = this.values[0];
      let changes = 0;
      for (const row of notifications) {
        if (row.user_id === userId && row.read_at === null) {
          row.read_at = "2026-11-18 00:00:00";
          changes++;
        }
      }
      return { success: true, meta: { changes } };
    }
    return { success: true, meta: { changes: 0 } };
  }
}

const env = { DB: { prepare: sql => new FakeStatement(sql), batch: async statements => Promise.all(statements.map(statement => statement.run())) }, ASSETS: { fetch: async () => new Response("<!doctype html><html><head><link rel=\"stylesheet\" href=\"/style.css\"></head><body>test page</body></html>", { headers: { "content-type": "text/html;charset=UTF-8" } }) }, APP_VERSION: "17.23.0", SITE_NAME: "Imperial Novel" };
async function request(token, method, body, path = "/api/history") {
  const headers = { cookie: "session=" + token };
  const init = { method, headers };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return worker.fetch(new Request("https://imperial.test" + path, init), env);
}
async function payload(response) {
  if (response.status !== 200) throw new Error("Unexpected API status " + response.status + ": " + await response.text());
  return response.json();
}

await payload(await request("reader-a-token", "POST", {
  novel_id: 10, chapter_number: 7, user_id: 202
}));
assert.deepEqual(history, [{ user_id: 101, novel_id: 10, chapter_number: 7 }],
  "A caller-supplied user_id must never override the authenticated account");

const bHistory = await payload(await request("reader-b-token", "GET"));
assert.deepEqual(bHistory, [], "Account B must not read Account A's history");

await payload(await request("reader-b-token", "POST", {
  novel_id: 10, chapter_number: 2, user_id: 101
}));
const aHistory = await payload(await request("reader-a-token", "GET"));
const bHistoryAfterWrite = await payload(await request("reader-b-token", "GET"));
assert.deepEqual(aHistory.map(row => row.chapter_number), [7],
  "Account A must continue to see only its own history");
assert.deepEqual(bHistoryAfterWrite.map(row => row.chapter_number), [2],
  "Account B must continue to see only its own history");
assert.deepEqual(history.map(row => row.user_id).sort((a, b) => a - b), [101, 202]);

const aLibrary = await payload(await request("reader-a-token", "GET", undefined, "/api/library"));
const bLibrary = await payload(await request("reader-b-token", "GET", undefined, "/api/library"));
assert.deepEqual(aLibrary.map(row => row.novel_id), [10],
  "Account A must see its own library entry");
assert.deepEqual(bLibrary, [],
  "Account B must not read Account A's library");

const aNotifications = await payload(await request("reader-a-token", "GET", undefined, "/api/notifications"));
const bNotifications = await payload(await request("reader-b-token", "GET", undefined, "/api/notifications"));
assert.deepEqual(aNotifications.map(row => row.id), [1],
  "Account A must see only its own notifications");
assert.deepEqual(bNotifications.map(row => row.id), [2],
  "Account B must see only its own notifications");

await payload(await request("reader-b-token", "POST", {}, "/api/notifications/read"));
assert.equal(notifications.find(row => row.id === 1).read_at, null,
  "Account B must not mark Account A's notifications as read");
assert.notEqual(notifications.find(row => row.id === 2).read_at, null,
  "Account B must be able to mark its own notifications as read");

const aLedger = await payload(await request("reader-a-token", "GET", undefined, "/api/tickets/ledger"));
const bLedger = await payload(await request("reader-b-token", "GET", undefined, "/api/tickets/ledger"));
assert.deepEqual(aLedger.map(row => row.reference), ["A-ORDER"],
  "Account A must see only its own ticket ledger");
assert.deepEqual(bLedger.map(row => row.reference), ["B-ORDER"],
  "Account B must see only its own ticket ledger");

const aApplication = await payload(await request("reader-a-token", "GET", undefined, "/api/author/applications/me"));
const bApplication = await payload(await request("reader-b-token", "GET", undefined, "/api/author/applications/me"));
assert.equal(aApplication.application.id, 31,
  "Account A must see its own author application status");
assert.equal(bApplication.application, null,
  "Account B must not read Account A's author application");

const aRequestUsage = await payload(await request("reader-a-token", "GET", undefined, "/api/requests"));
const bRequestUsage = await payload(await request("reader-b-token", "GET", undefined, "/api/requests"));
assert.equal(aRequestUsage.used, 2, "Account A must see only its own weekly novel-request usage");
assert.equal(bRequestUsage.used, 1, "Account B must not read Account A weekly novel-request usage");

const aRecommendations = await payload(await request("reader-a-token", "GET", undefined, "/api/recommendations"));
const bRecommendations = await payload(await request("reader-b-token", "GET", undefined, "/api/recommendations"));
assert.deepEqual(aRecommendations.map(row => row.id), [10], "Account A must see only its own recommendations");
assert.deepEqual(bRecommendations.map(row => row.id), [20], "Account B must not read Account A recommendations");
assert.equal(aRecommendations[0].reason, "Matches Account A reading history");
assert.equal(bRecommendations[0].reason, "Matches Account B reading history");

const aFollows = await payload(await request("reader-a-token", "GET", undefined, "/api/follows"));
const bFollows = await payload(await request("reader-b-token", "GET", undefined, "/api/follows"));
assert.deepEqual(aFollows.map(row => row.id), [10],
  "Account A must see its own follows");
assert.deepEqual(bFollows, [],
  "Account B must not read Account A's follows");

await payload(await request("reader-b-token", "POST", { novel_id: 10, user_id: 101 }, "/api/follow"));

const adminOnlyRoutes = [
  ["GET", "/api/admin/agents"],
  ["POST", "/api/admin/agents/run"],
  ["GET", "/api/admin/taxonomy"],
  ["POST", "/api/admin/taxonomy"],
  ["GET", "/api/admin/community/comments"],
  ["PATCH", "/api/admin/community/comments"],
  ["GET", "/api/admin/community/reports"],
  ["PATCH", "/api/admin/community/reports"],
  ["GET", "/api/admin/author-applications"],
  ["GET", "/api/admin/stats"],
  ["GET", "/api/admin/users"],
  ["GET", "/api/admin/publishing"],
  ["POST", "/api/admin/publishing/chapters/reorder"],
  ["POST", "/api/admin/publishing/chapters"],
  ["GET", "/api/admin/donations"],
  ["GET", "/api/admin/reports"],
  ["POST", "/api/admin/tickets"],
  ["GET", "/api/admin/connectors"],
  ["POST", "/api/admin/omni/health"],
  ["POST", "/api/admin/connectors/cleanup"],
  ["GET", "/api/admin/requests"],
  ["PATCH", "/api/admin/requests/1"],
  ["GET", "/api/admin/connector-authorization-requests"],
];
for (const [method, path] of adminOnlyRoutes) {
  const response = await request("reader-a-token", method, method === "GET" ? undefined : {}, path);
  assert.equal(response.status, 403, "Ordinary reader accounts must be denied admin route " + method + " " + path);
}
assert.deepEqual(follows.sort((a, b) => a.user_id - b.user_id), [
  { user_id: 101, novel_id: 10 }, { user_id: 202, novel_id: 10 }
], "Follow ownership must use the authenticated session, not a forged user_id");

async function page(token, path) {
  const headers = token ? { cookie: "session=" + token } : {};
  return worker.fetch(new Request("https://imperial.test" + path, { method: "GET", headers }), env);
}
const privateAnonymous = await page(null, "/library");
assert.equal(privateAnonymous.status, 302, "Anonymous visitors must be redirected away from private library pages");
assert.match(privateAnonymous.headers.get("location") || "", /\/login\?next=%2Flibrary/);
const privateReader = await page("reader-a-token", "/library");
assert.equal(privateReader.status, 200, "Authenticated readers may access their private library page");
assert.equal(privateReader.headers.get("x-robots-tag"), "noindex, nofollow");
const adminReader = await page("reader-a-token", "/admin");
assert.equal(adminReader.status, 403, "Ordinary readers must not receive the administrator page document");
const adminPage = await page("admin-token", "/admin");
assert.equal(adminPage.status, 200, "Administrators may receive the administrator page document");
const authorReader = await page("reader-a-token", "/author");
assert.equal(authorReader.status, 403, "Ordinary readers must not receive Author Studio");
const authorPage = await page("author-token", "/author");
assert.equal(authorPage.status, 200, "Authors may receive Author Studio");
const anonymousAuthor = await page(null, "/author");
assert.equal(anonymousAuthor.status, 302, "Anonymous visitors must be redirected away from Author Studio");
const publicAuthor = await page(null, "/author/public-name");
assert.equal(publicAuthor.status, 200, "Public author profiles must remain publicly accessible");

console.log("PASS: Worker fetch two-account history, library, notification, follow, recommendations, weekly request usage, ticket-ledger, and author-application isolation; ordinary-reader denial across 23 admin read/write routes; authenticated history/follow ownership; forged user_id rejection; account-scoped notification mutation, and server-side private-page authorization using a deterministic D1 test double. This is not a live Cloudflare D1 test.");
