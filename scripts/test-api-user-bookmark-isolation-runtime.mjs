import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);
const users = new Map([
  ["bookmark-a-token", { id: 301, username: "bookmark_a", email: "a@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["bookmark-b-token", { id: 402, username: "bookmark_b", email: "b@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of users) sessions.set(await hash(token), user);
const bookmarks = [];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT c.id FROM novels n JOIN chapters c ON c.novel_id=n.id")) {
      return this.values[0] === 10 && this.values[1] === 7 ? { id: 700 } : null;
    }
    return null;
  }
  async all() {
    if (this.sql.includes("FROM bookmarks b JOIN novels n")) {
      return { results: bookmarks.filter(row => row.user_id === this.values[0]).map(row => ({
        novel_id: row.novel_id, chapter_number: row.chapter_number,
        updated_at: "2026-11-18 00:00:00", title: "Test Novel",
        author: "Test Author", cover_url: ""
      })) };
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
    return { success: true, meta: { changes: 0 } };
  }
}

const env = { DB: { prepare: sql => new FakeStatement(sql) }, SITE_NAME: "Imperial Novel" };
async function request(token, path, method, body) {
  const headers = { cookie: "session=" + token };
  const init = { method, headers };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return worker.fetch(new Request("https://imperial.test" + path, init), env);
}
async function payload(response, expectedStatus = 200) {
  if (response.status !== expectedStatus) throw new Error("Expected " + expectedStatus + ", received " + response.status + ": " + await response.text());
  return response.status === 204 ? null : response.json();
}

await payload(await request("bookmark-a-token", "/api/bookmark", "POST", {
  novel_id: 10, chapter_number: 7, user_id: 402
}));
assert.deepEqual(bookmarks, [{ user_id: 301, novel_id: 10, chapter_number: 7 }],
  "Bookmark ownership must come from the authenticated session, not request JSON");

assert.deepEqual(await payload(await request("bookmark-b-token", "/api/bookmarks", "GET")), [],
  "Account B must not read Account A's bookmark");
assert.deepEqual((await payload(await request("bookmark-a-token", "/api/bookmarks", "GET"))).map(row => row.chapter_number), [7],
  "Account A must read its own bookmark");

await payload(await request("bookmark-a-token", "/api/bookmark", "POST", {
  novel_id: 0, chapter_number: 7
}), 400);
await payload(await request("bookmark-a-token", "/api/bookmark", "POST", {
  novel_id: 10, chapter_number: 8
}), 404);
assert.deepEqual(bookmarks, [{ user_id: 301, novel_id: 10, chapter_number: 7 }],
  "Invalid IDs and chapters not belonging to the novel must not be persisted");

console.log("PASS: Worker fetch two-account bookmark isolation, forged user_id rejection, and novel/chapter relationship validation using a deterministic D1 test double. This is not a live Cloudflare D1 test.");
