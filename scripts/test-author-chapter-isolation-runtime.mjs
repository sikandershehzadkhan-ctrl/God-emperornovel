import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);
const users = new Map([
  ["chapter-a-token", { id: 101, username: "chapter_a", email: "a@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["chapter-b-token", { id: 202, username: "chapter_b", email: "b@example.test", role: "author", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of users) sessions.set(await hash(token), user);

const novels = new Map([
  [10, { id: 10, owner_user_id: 101, kind: "original", rights_status: "original" }],
  [20, { id: 20, owner_user_id: 202, kind: "original", rights_status: "original" }],
  [30, { id: 30, owner_user_id: 101, kind: "comic", rights_status: "original" }],
]);
const chapters = new Map([
  [700, { id: 700, novel_id: 10, chapter_number: 1, title: "A private chapter", content: "<p>Draft A</p>", owner_user_id: 101, rights_status: "original", publication_status: "draft", is_locked: 0, ticket_cost: 0 }],
  [800, { id: 800, novel_id: 20, chapter_number: 1, title: "B private chapter", content: "<p>Draft B</p>", owner_user_id: 202, rights_status: "original", publication_status: "draft", is_locked: 0, ticket_cost: 0 }],
  [900, { id: 900, novel_id: 30, chapter_number: 1, title: "Comic chapter", content: JSON.stringify({type:"imperial_comic_chapter",version:1,pages:[{src:"https://cdn.example.com/one.webp",alt:"Page one"}]}), owner_user_id: 101, rights_status: "original", publication_status: "draft", is_locked: 0, ticket_cost: 0 }],
]);
const writes = [];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT c.*,n.owner_user_id,n.rights_status FROM chapters c JOIN novels n")) {
      const row = chapters.get(Number(this.values[0]));
      if (!row) return null;
      const novel = novels.get(row.novel_id);
      return { ...row, owner_user_id: novel.owner_user_id, rights_status: novel.rights_status };
    }
    if (this.sql.includes("SELECT c.*,n.owner_user_id,n.kind AS novel_kind FROM chapters c JOIN novels n")) {
      const row = chapters.get(Number(this.values[0]));
      if (!row) return null;
      return { ...row, owner_user_id: novels.get(row.novel_id).owner_user_id, novel_kind: novels.get(row.novel_id).kind };
    }
    if (this.sql.includes("SELECT id,owner_user_id FROM novels WHERE id=?")) {
      const row = novels.get(Number(this.values[0]));
      return row ? { id: row.id, owner_user_id: row.owner_user_id } : null;
    }
    return null;
  }
  async all() {
    if (this.sql.includes("FROM chapters WHERE novel_id=?")) {
      return { results: [...chapters.values()].filter(row => row.novel_id === Number(this.values[0])).map(row => ({ ...row })) };
    }
    return { results: [] };
  }
  async run() {
    if (this.sql.includes("UPDATE chapters SET publication_status=?")) {
      const [status, id] = this.values;
      const row = chapters.get(Number(id));
      if (row) row.publication_status = status;
      writes.push({ table: "chapters", id: Number(id), status });
      return { success: true, meta: { changes: row ? 1 : 0 } };
    }
    if (this.sql.includes("UPDATE chapters SET chapter_number=?")) {
      const [chapter_number, title, content, is_locked, ticket_cost, id] = this.values;
      const row = chapters.get(Number(id));
      if (row) Object.assign(row, { chapter_number, title, content, is_locked, ticket_cost });
      writes.push({ table: "chapters", id: Number(id), operation: "edit" });
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
async function expectStatus(response, expected) {
  if (response.status !== expected) throw new Error("Expected " + expected + ", received " + response.status + ": " + await response.text());
  return expected === 200 || expected === 201 ? response.json() : null;
}

await expectStatus(await request("chapter-a-token", "POST", "/api/author/chapters/700/publish", { publication_status: "published" }), 200);
assert.equal(chapters.get(700).publication_status, "published",
  "The owner must be able to publish their chapter using the numeric path ID");

const before = writes.length;
await expectStatus(await request("chapter-b-token", "POST", "/api/author/chapters/700/publish", { publication_status: "draft" }), 403);
assert.equal(writes.length, before, "A different author must not change another author's chapter publication state");
assert.equal(chapters.get(700).publication_status, "published");

await expectStatus(await request("chapter-b-token", "PATCH", "/api/author/chapters/700", { title: "Stolen title" }), 403);
assert.equal(chapters.get(700).title, "A private chapter",
  "A different author must not edit another author's chapter");

const invalidComic = await request("chapter-a-token", "PATCH", "/api/author/chapters/900", {
  content: "<p>This is not the required comic page document.</p>"
});
await expectStatus(invalidComic, 400);
assert.notEqual(chapters.get(900).content, "<p>This is not the required comic page document.</p>",
  "Invalid comic content must not be persisted during edits");

const validComic = JSON.stringify({type:"imperial_comic_chapter",version:1,pages:[{src:"https://cdn.example.com/two.webp",alt:"Page two"}]});
await expectStatus(await request("chapter-a-token", "PATCH", "/api/author/chapters/900", { content: validComic }), 200);
assert.equal(chapters.get(900).content, validComic,
  "Valid comic page documents must remain editable");

const own = await expectStatus(await request("chapter-b-token", "GET", "/api/author/chapters?novel_id=20"), 200);
assert.deepEqual(own.map(row => row.id), [800], "Authors must list chapters only for novels they own");
console.log("PASS: Worker fetch two-author chapter publish/edit/list ownership and chapter-ID route parsing using deterministic D1 test double. This is not a live Cloudflare D1 test.");
