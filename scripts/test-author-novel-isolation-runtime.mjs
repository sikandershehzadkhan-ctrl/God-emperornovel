import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);
const users = new Map([
  ["author-a-token", { id: 101, username: "author_a", email: "a@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["author-b-token", { id: 202, username: "author_b", email: "b@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of users) sessions.set(await hash(token), user);
const novels = [
  { id: 11, owner_user_id: 101, title: "Author A novel", author: "Author A", kind: "original", rights_status: "original", rights_evidence: "", rights_notes: "", publication_status: "draft", status: "ongoing", language: "English" },
  { id: 22, owner_user_id: 202, title: "Author B novel", author: "Author B", kind: "original", rights_status: "original", rights_evidence: "", rights_notes: "", publication_status: "draft", status: "ongoing", language: "English" },
];
const writes = [];
class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT * FROM novels WHERE id=?")) return novels.find(row => row.id === Number(this.values[0])) || null;
    return null;
  }
  async all() {
    if (this.sql.includes("FROM novels n WHERE n.owner_user_id=?")) {
      return { results: novels.filter(row => row.owner_user_id === this.values[0]).map(row => ({ ...row, chapter_count: 0, published_chapters: 0 })) };
    }
    return { results: [] };
  }
  async run() {
    if (this.sql.includes("INSERT INTO novels(")) {
      const v = this.values;
      const row = { id: 33, title: v[0], alt_titles: v[1], author: v[2], description: v[3], status: v[4], kind: v[5], language: v[6], cover_url: v[7], source_url: v[8], rights_status: v[9], owner_user_id: v[10], publication_status: v[11], rights_evidence: v[12], rights_notes: v[13] };
      novels.push(row); writes.push({ type: "insert", owner_user_id: row.owner_user_id });
      return { success: true, meta: { changes: 1, last_row_id: row.id } };
    }
    if (this.sql.includes("UPDATE novels SET title=?")) {
      const id = Number(this.values[this.values.length - 1]);
      const row = novels.find(item => item.id === id);
      if (row) { row.title = this.values[0]; writes.push({ type: "update", id }); }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (this.sql.includes("UPDATE novels SET publication_status='review'")) {
      const id = Number(this.values[0]);
      const row = novels.find(item => item.id === id);
      if (row) { row.publication_status = "review"; writes.push({ type: "submit", id }); }
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    return { success: true, meta: { changes: 0 } };
  }
}
const env = { DB: { prepare: sql => new FakeStatement(sql) }, SITE_NAME: "Imperial Novel" };
async function request(token, method, path, body) {
  const headers = { cookie: "session=" + token };
  const init = { method, headers };
  if (body !== undefined) { headers["content-type"] = "application/json"; init.body = JSON.stringify(body); }
  return worker.fetch(new Request("https://imperial.test" + path, init), env);
}
async function expect(response, status) {
  assert.equal(response.status, status, "Unexpected response: " + await response.clone().text());
  return status === 200 || status === 201 ? response.json() : null;
}

const aList = await expect(await request("author-a-token", "GET", "/api/author/novels"), 200);
const bList = await expect(await request("author-b-token", "GET", "/api/author/novels"), 200);
assert.deepEqual(aList.map(row => row.id), [11], "Author A must see only their novel");
assert.deepEqual(bList.map(row => row.id), [22], "Author B must see only their novel");

await expect(await request("author-a-token", "PATCH", "/api/author/novels/11", { title: "Author A revised" }), 200);
const writeCount = writes.length;
await expect(await request("author-b-token", "PATCH", "/api/author/novels/11", { title: "Stolen title" }), 403);
assert.equal(writes.length, writeCount, "Non-owner novel edit must not persist");
assert.equal(novels.find(row => row.id === 11).title, "Author A revised");

await expect(await request("author-b-token", "POST", "/api/author/novels/11/submit", {}), 403);
assert.equal(novels.find(row => row.id === 11).publication_status, "draft",
  "Non-owner must not submit another author's novel for publication");

await expect(await request("author-a-token", "POST", "/api/author/novels", {
  title: "New Author A work", author: "Author A", kind: "original",
  rights_status: "original", owner_user_id: 202
}), 201);
assert.equal(novels.find(row => row.id === 33).owner_user_id, 101,
  "Novel creation must derive owner_user_id from the authenticated author, not request JSON");
console.log("PASS: Worker fetch verifies two-author novel list/edit/submit isolation and authenticated ownership on creation using a deterministic D1 test double. This is not a live Cloudflare D1 test.");
