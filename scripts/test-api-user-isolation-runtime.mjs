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
]);
const sessions = new Map();
for (const [token, user] of accounts) sessions.set(await hash(token), user);
const history = [];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT 1 FROM novels WHERE id=?")) return Number(this.values[0]) === 10 ? { ok: 1 } : null;
    return null;
  }
  async all() {
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
    return { success: true, meta: { changes: 0 } };
  }
}

const env = { DB: { prepare: sql => new FakeStatement(sql) }, SITE_NAME: "Imperial Novel" };
async function request(token, method, body) {
  const headers = { cookie: "session=" + token };
  const init = { method, headers };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return worker.fetch(new Request("https://imperial.test/api/history", init), env);
}
async function payload(response) {
  assert.equal(response.status, 200, await response.text());
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

console.log("PASS: Worker fetch two-account history isolation, authenticated ownership, and forged user_id rejection using a deterministic D1 test double. This is not a live Cloudflare D1 test.");
