import assert from "node:assert/strict";
import worker from "../src/index.js";

const encoder = new TextEncoder();
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const hash = async value => b64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const now = Math.floor(Date.now() / 1000);
const users = new Map([
  ["submitter-a-token", { id: 101, username: "submitter_a", email: "a@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
  ["submitter-b-token", { id: 202, username: "submitter_b", email: "b@example.test", role: "user", tickets: 0, verified: 1, banned: 0, expires_at: now + 3600 }],
]);
const sessions = new Map();
for (const [token, user] of users) sessions.set(await hash(token), user);
const submissions = [];
const writes = [];

class FakeStatement {
  constructor(sql) { this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() {
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='core_schema_version'")) return { value: "16.64.0" };
    if (this.sql.includes("SELECT value FROM app_settings WHERE key='runtime_feature_schema_version'")) return { value: "1" };
    if (this.sql.includes("FROM sessions s JOIN users u ON u.id=s.user_id")) return sessions.get(this.values[0]) || null;
    if (this.sql.includes("SELECT id FROM genres WHERE slug=?")) return null;
    if (this.sql.includes("SELECT id FROM tags WHERE slug=?")) return null;
    if (this.sql.includes("SELECT id,status FROM taxonomy_submissions WHERE type=? AND slug=?")) {
      return submissions.find(row => row.type === this.values[0] && row.slug === this.values[1]) || null;
    }
    return null;
  }
  async all() { return { results: [] }; }
  async run() {
    if (this.sql.includes("INSERT INTO taxonomy_submissions(")) {
      const [type, name, slug, description, creator_id, creator_name, status] = this.values;
      const row = { id: submissions.length + 1, type, name, slug, description, creator_id, creator_name, status };
      submissions.push(row);
      writes.push({ ...row });
      return { success: true, meta: { changes: 1, last_row_id: row.id } };
    }
    return { success: true, meta: { changes: 0 } };
  }
}

const env = { DB: { prepare: sql => new FakeStatement(sql) }, SITE_NAME: "Imperial Novel" };
async function submit(token, name, creator_id) {
  const headers = { "content-type": "application/json" };
  if (token) headers.cookie = "session=" + token;
  return worker.fetch(new Request("https://imperial.test/api/taxonomy", {
    method: "POST", headers,
    body: JSON.stringify({ type: "genre", name, creator_id, creator_name: "Display name supplied by form" })
  }), env);
}

let response = await submit("submitter-a-token", "Account A proposal", 202);
assert.equal(response.status, 200);
assert.equal(submissions[0].creator_id, 101,
  "Authenticated submitter identity must come from Account A's session, not forged Account B ID");
assert.equal(submissions[0].creator_name, "Display name supplied by form",
  "The optional public-form display name remains user supplied");
assert.equal(submissions[0].status, "pending",
  "New proposals must remain pending moderation");

response = await submit(null, "Anonymous proposal", 202);
assert.equal(response.status, 200);
assert.equal(submissions[1].creator_id, null,
  "Anonymous proposal must not accept a forged creator ID");
assert.equal(submissions[1].status, "pending");

assert.equal(writes.length, 2, "Only the two intended proposals should be persisted");
console.log("PASS: Worker fetch verifies authenticated taxonomy submitter identity, forged creator_id rejection, anonymous null identity, display-name preservation, and pending moderation using a deterministic D1 test double. This is not a live Cloudflare D1 test.");
