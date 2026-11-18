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
const project = {
  id: 77, owner_user_id: 101, novel_id: null, name: "Author A private project",
  mode: "manual", status: "draft", genre: "Fantasy", fandom: "Original World",
  premise: "Private premise", protagonist: "A protagonist", settings_json: "{}", bible_json: "{}",
  auto_publish: 0, chapters_target: 10, chapters_generated: 0
};
const jobs = [{ id: 5, project_id: 77, chapter_number: 1, job_type: "draft", status: "queued" }];
const writes = [];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT owner_user_id FROM ai_author_projects WHERE id=?")) {
      return Number(this.values[0]) === project.id ? { owner_user_id: project.owner_user_id } : null;
    }
    if (this.sql.includes("SELECT * FROM ai_author_projects WHERE id=?")) {
      return Number(this.values[0]) === project.id ? { ...project } : null;
    }
    return null;
  }
  async all() {
    if (this.sql.includes("FROM ai_author_projects p LEFT JOIN novels n")) {
      return { results: project.owner_user_id === this.values[0] ? [{ ...project, novel_title: null }] : [] };
    }
    if (this.sql.includes("FROM ai_chapter_jobs WHERE project_id=?")) {
      return Number(this.values[0]) === project.id ? jobs.map(row => ({ ...row })) : [];
    }
    return { results: [] };
  }
  async run() {
    if (this.sql.includes("UPDATE ai_author_projects SET name=?")) {
      writes.push({ sql: this.sql, values: this.values });
      project.name = this.values[0];
      return { success: true, meta: { changes: 1 } };
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
async function json(response, expectedStatus = 200) {
  if (response.status !== expectedStatus) {
    throw new Error("Expected status " + expectedStatus + ", received " + response.status + ": " + await response.text());
  }
  return expectedStatus === 200 ? response.json() : null;
}

const base = "/api/author/ai/projects";
const aList = await json(await request("author-a-token", "GET", base));
const bList = await json(await request("author-b-token", "GET", base));
assert.deepEqual(aList.map(row => row.id), [77], "Author A must see their own AI project");
assert.deepEqual(bList, [], "Author B must not see Author A's AI project");

await json(await request("author-a-token", "GET", base + "/77"));
await json(await request("author-b-token", "GET", base + "/77"), 403);
await json(await request("author-a-token", "PATCH", base + "/77", { name: "Author A updated" }));
const writeCount = writes.length;
await json(await request("author-b-token", "PATCH", base + "/77", { name: "Stolen project" }), 403);
assert.equal(writes.length, writeCount, "A non-owner must not update another author's AI project");
assert.equal(project.name, "Author A updated", "The project must retain the legitimate owner's update");

await json(await request("author-a-token", "GET", base + "/77/jobs"));
await json(await request("author-b-token", "GET", base + "/77/jobs"), 403);
console.log("PASS: Worker fetch two-author AI project list/detail/update/jobs isolation using deterministic D1 test double. This is not a live Cloudflare D1 test.");
