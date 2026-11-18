// Worker-level two-account isolation tests using a deterministic D1 test double.
// This exercises the real Worker fetch handler, but is not a live Cloudflare D1 test.
import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);
const users = new Map([
  ["account-a-token", { id: 301, username: "account_a", email: "a@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["account-b-token", { id: 402, username: "account_b", email: "b@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of users) sessions.set(await hash(token), user);
const bookmarks = [], history = [], library = [];
const follows = [{ user_id: 301, novel_id: 10, created_at: "2026-11-18 00:00:00" }];
const notifications = [{ id: 1, user_id: 301, message: "Private notice" }];
const ticketLedger = [{ id: 1, user_id: 301, delta: -5, reason: "test", reference: "private", created_at: "2026-11-18 00:00:00" }];
const authorApplications = [{ id: 91, user_id: 301, display_name: "A's private application", bio: "Private", experience: "New", portfolio_url: "", preferred_formats: '["original"]', status: "pending" }];
const novels = [{ id: 501, owner_user_id: 301, title: "A's Novel", author: "account_a", description: "", status: "ongoing", kind: "original", language: "English", rights_status: "original", publication_status: "draft" }];
const chapters = [{ id: 601, novel_id: 501, chapter_number: 1, title: "A's Chapter", content: "Chapter text", is_locked: 0, ticket_cost: 0, owner_user_id: 301, kind: "original" }];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT c.id FROM novels n JOIN chapters c ON c.novel_id=n.id") ||
        this.sql.includes("SELECT c.id FROM chapters c JOIN novels n ON n.id=c.novel_id")) {
      return this.values[0] === 10 && this.values[1] === 7 ? { id: 700 } : null;
    }
    if (this.sql.includes("SELECT id FROM novels WHERE id=? AND publication_status='published'")) {
      return this.values[0] === 10 ? { id: 10 } : null;
    }
    if (this.sql.includes("SELECT 1 FROM user_library WHERE user_id=? AND novel_id=?")) {
      return library.some(row => row.user_id === this.values[0] && row.novel_id === this.values[1]) ? { 1: 1 } : null;
    }
    if (this.sql.includes("FROM author_applications WHERE user_id=?")) return authorApplications.find(row => row.user_id === this.values[0]) || null;
    if (this.sql.includes("SELECT * FROM novels WHERE id=?")) return novels.find(row => row.id === this.values[0]) || null;
    if (this.sql.includes("SELECT c.*,n.owner_user_id,n.kind FROM chapters c JOIN novels n ON n.id=c.novel_id WHERE c.id=?")) {
      return chapters.find(row => row.id === this.values[0]) || null;
    }
    if (this.sql.includes("SELECT id FROM chapters WHERE novel_id=? AND chapter_number=? AND id<>?")) return null;
    return null;
  }
  async all() {
    if (this.sql.includes("FROM bookmarks b JOIN novels n")) {
      return { results: bookmarks.filter(row => row.user_id === this.values[0]).map(row => ({
        novel_id: row.novel_id, chapter_number: row.chapter_number, updated_at: "2026-11-18 00:00:00",
        title: "Test Novel", author: "Test Author", cover_url: ""
      })) };
    }
    if (this.sql.includes("FROM history h JOIN novels n")) {
      return { results: history.filter(row => row.user_id === this.values[0]).map(row => ({
        novel_id: row.novel_id, chapter_number: row.chapter_number, updated_at: "2026-11-18 00:00:00",
        title: "Test Novel", author: "Test Author", cover_url: ""
      })) };
    }
    if (this.sql.includes("FROM user_library l JOIN novels n")) {
      return { results: library.filter(row => row.user_id === this.values[0]).map(row => ({
        novel_id: row.novel_id, created_at: "2026-11-18 00:00:00", title: "Test Novel",
        author: "Test Author", cover_url: "", rating: 0, status: "ongoing",
        last_chapter: null, bookmark_chapter: null, latest_chapter: 7
      })) };
    }
    if (this.sql.includes("FROM novels n WHERE n.owner_user_id=?")) {
      return { results: novels.filter(row => row.owner_user_id === this.values[0]) };
    }
    if (this.sql.includes("FROM follows f JOIN novels n")) {
      return { results: follows.filter(row => row.user_id === this.values[0]).map(row => ({ ...row, id: row.novel_id, title: "Followed Novel", publication_status: "published", rights_status: "original" })) };
    }
    if (this.sql.includes("FROM notifications WHERE user_id=?")) {
      return { results: notifications.filter(row => row.user_id === this.values[0]) };
    }
    if (this.sql.includes("FROM ticket_ledger WHERE user_id=?")) {
      return { results: ticketLedger.filter(row => row.user_id === this.values[0]) };
    }
    return { results: [] };
  }
  async run() {
    if (this.sql.includes("INSERT INTO bookmarks(user_id,novel_id,chapter_number)")) {
      const [user_id, novel_id, chapter_number] = this.values;
      const existing = bookmarks.find(row => row.user_id === user_id && row.novel_id === novel_id);
      if (existing) existing.chapter_number = chapter_number;
      else bookmarks.push({ user_id, novel_id, chapter_number });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.includes("INSERT INTO history(user_id,novel_id,chapter_number)")) {
      const [user_id, novel_id, chapter_number] = this.values;
      const existing = history.find(row => row.user_id === user_id && row.novel_id === novel_id);
      if (existing) existing.chapter_number = chapter_number;
      else history.push({ user_id, novel_id, chapter_number });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.includes("DELETE FROM user_library WHERE user_id=? AND novel_id=?")) {
      const index = library.findIndex(row => row.user_id === this.values[0] && row.novel_id === this.values[1]);
      if (index >= 0) library.splice(index, 1);
      return { success: true, meta: { changes: index >= 0 ? 1 : 0 } };
    }
    if (this.sql.includes("INSERT OR IGNORE INTO user_library(user_id,novel_id)")) {
      const [user_id, novel_id] = this.values;
      if (!library.some(row => row.user_id === user_id && row.novel_id === novel_id)) library.push({ user_id, novel_id });
      return { success: true, meta: { changes: 1 } };
    }
    if (this.sql.includes("UPDATE novels SET title=?")) return { success: true, meta: { changes: 1 } };
    if (this.sql.includes("UPDATE chapters SET chapter_number=?")) {
      const row = chapters.find(item => item.id === this.values[5]);
      if (row) { row.chapter_number = this.values[0]; row.title = this.values[1]; row.content = this.values[2]; }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    return { success: true, meta: { changes: 0 } };
  }
}

const env = { DB: { prepare: sql => new FakeStatement(sql) }, SITE_NAME: "Imperial Novel" };
async function request(token, path, method, body) {
  const headers = { cookie: "session=" + token };
  const init = { method, headers };
  if (body !== undefined) { headers["content-type"] = "application/json"; init.body = JSON.stringify(body); }
  return worker.fetch(new Request("https://imperial.test" + path, init), env);
}
async function payload(response, expectedStatus = 200) {
  if (response.status !== expectedStatus) throw new Error("Expected " + expectedStatus + ", received " + response.status + ": " + await response.text());
  return response.status === 204 ? null : response.json();
}

// Account A writes; a forged user_id must not transfer ownership to Account B.
await payload(await request("account-a-token", "/api/bookmark", "POST", { novel_id: 10, chapter_number: 7, user_id: 402 }));
assert.deepEqual(bookmarks, [{ user_id: 301, novel_id: 10, chapter_number: 7 }]);
assert.deepEqual(await payload(await request("account-b-token", "/api/bookmarks", "GET")), [], "B must not read A's bookmark");
assert.deepEqual((await payload(await request("account-a-token", "/api/bookmarks", "GET"))).map(row => row.chapter_number), [7]);
await payload(await request("account-a-token", "/api/bookmark", "POST", { novel_id: 0, chapter_number: 7 }), 400);
await payload(await request("account-a-token", "/api/bookmark", "POST", { novel_id: 10, chapter_number: 8 }), 404);
assert.equal(bookmarks.length, 1, "Invalid bookmark targets must not be persisted");

// Reading progress is independently scoped to the authenticated account.
await payload(await request("account-a-token", "/api/history", "POST", { novel_id: 10, chapter_number: 7, user_id: 402 }));
assert.deepEqual(history, [{ user_id: 301, novel_id: 10, chapter_number: 7 }]);
assert.deepEqual(await payload(await request("account-b-token", "/api/history", "GET")), [], "B must not read A's history");
assert.deepEqual((await payload(await request("account-a-token", "/api/history", "GET"))).map(row => row.chapter_number), [7]);
await payload(await request("account-a-token", "/api/history", "POST", { novel_id: 10, chapter_number: 8 }), 404);
assert.equal(history.length, 1, "A chapter not belonging to the selected novel must not be recorded");

// Personal library membership must be scoped on both insert and read.
await payload(await request("account-a-token", "/api/library", "POST", { novel_id: 10 }));
assert.deepEqual(library, [{ user_id: 301, novel_id: 10 }]);
assert.deepEqual(await payload(await request("account-b-token", "/api/library", "GET")), [], "B must not read A's library");
assert.deepEqual((await payload(await request("account-a-token", "/api/library", "GET"))).map(row => row.novel_id), [10]);
await payload(await request("account-b-token", "/api/library", "POST", { novel_id: 10 }));
assert.deepEqual(library, [{ user_id: 301, novel_id: 10 }, { user_id: 402, novel_id: 10 }],
  "Each account must receive its own library membership row");

// Author workspace reads and writes must enforce ownership of the addressed novel and chapter.
assert.deepEqual((await payload(await request("account-a-token", "/api/author/novels", "GET"))).map(row => row.id), [501]);
assert.deepEqual(await payload(await request("account-b-token", "/api/author/novels", "GET")), [],
  "Author B must not list Author A's novel");
await payload(await request("account-a-token", "/api/author/novels/501", "PATCH", { title: "A's Updated Novel" }));
await payload(await request("account-b-token", "/api/author/novels/501", "PATCH", { title: "Hijacked Novel" }), 403);
await payload(await request("account-a-token", "/api/author/chapters/601", "PATCH", { title: "A's Updated Chapter" }));
await payload(await request("account-b-token", "/api/author/chapters/601", "PATCH", { title: "Hijacked Chapter" }), 403);
assert.equal(chapters[0].title, "A's Updated Chapter", "Author B must not overwrite Author A's chapter");

// Additional private account feeds must never return another account's rows.
assert.deepEqual(await payload(await request("account-b-token", "/api/follows", "GET")), [], "B must not read A's follows");
assert.deepEqual((await payload(await request("account-a-token", "/api/follows", "GET"))).map(row => row.id), [10]);
assert.deepEqual(await payload(await request("account-b-token", "/api/notifications", "GET")), [], "B must not read A's notifications");
assert.deepEqual((await payload(await request("account-a-token", "/api/notifications", "GET"))).map(row => row.id), [1]);
assert.deepEqual(await payload(await request("account-b-token", "/api/tickets/ledger", "GET")), [], "B must not read A's ticket ledger");
assert.deepEqual((await payload(await request("account-a-token", "/api/tickets/ledger", "GET"))).map(row => row.delta), [-5]);
const bApplication = await payload(await request("account-b-token", "/api/author/applications/me", "GET"));
assert.equal(bApplication.application, null, "B must not read A's author application");
const aApplication = await payload(await request("account-a-token", "/api/author/applications/me", "GET"));
assert.equal(aApplication.application.id, 91, "A must be able to read A's own author application");

console.log("PASS: Worker fetch two-account isolation for bookmarks, history, library, follows, notifications, ticket ledger, author applications, author novel listing/update, and author chapter update; forged identity and invalid chapter relationships rejected. Deterministic D1 test double only, not live Cloudflare D1.");
