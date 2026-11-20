import assert from "node:assert/strict";
import worker from "../src/index.js";

function makeD1(initialUser = null) {
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      const entry = { sql, values: [] };
      const statement = {
        bind(...values) { entry.values = values; return this; },
        async first() {
          calls.push({ ...entry, operation:"first" });
          if (sql.includes("key='core_schema_version'")) return { value:"16.64.0" };
          if (sql.includes("key='runtime_feature_schema_version'")) return { value:"1" };
          if (sql.includes("FROM sessions s JOIN users u")) return initialUser
            ? { ...initialUser, banned:0, expires_at:Math.floor(Date.now()/1000)+3600 }
            : null;
          if (sql.includes("FROM ai_author_projects WHERE id=?")) return { id:42, owner_user_id:2, name:"Other author's project" };
          if (sql.includes("FROM novels WHERE id=? AND publication_status='published'")) return null;
          if (sql.includes("FROM chapters c JOIN novels n")) return null;
          return null;
        },
        async all() {
          calls.push({ ...entry, operation:"all" });
          return { results:[] };
        },
        async run() {
          calls.push({ ...entry, operation:"run" });
          return { meta:{ changes:0, last_row_id:1 } };
        }
      };
      return statement;
    },
    async batch(statements) {
      for (const statement of statements) await statement.run();
      return [];
    }
  };
  return db;
}
const request = (path, user, init = {}) => {
  const headers = new Headers(init.headers || {});
  if (user) headers.set("cookie", "session=runtime-api-test-session");
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request("https://imperial.example" + path, { ...init, headers });
};
async function call(path, user, init = {}) {
  const DB = makeD1(user);
  const response = await worker.fetch(request(path, user, init), { DB });
  return { response, DB, payload:await response.json() };
}

const regularUser = { id:1, username:"reader-one", email:"reader@example.test", role:"user", tickets:100, verified:1 };
const authorUser = { ...regularUser, role:"author" };
const adminUser = { ...regularUser, role:"admin" };

const deniedAdmin = await call("/api/admin/agents", regularUser);
assert.equal(deniedAdmin.response.status, 403);
assert.equal(deniedAdmin.payload.error, "Administrator access required");

const allowedAdmin = await call("/api/admin/agents", adminUser);
assert.equal(allowedAdmin.response.status, 200);
assert.deepEqual(allowedAdmin.payload, []);

const foreignAuthorProject = await call("/api/author/ai/projects/42", authorUser);
assert.equal(foreignAuthorProject.response.status, 403);
assert.equal(foreignAuthorProject.payload.error, "You do not own this project");

const ownJobs = await call("/api/omni/jobs?user_id=999", regularUser);
assert.equal(ownJobs.response.status, 200);
assert.deepEqual(ownJobs.payload, []);
const jobQuery = ownJobs.DB.calls.find(entry => entry.sql.includes("WHERE j.user_id=?"));
assert.ok(jobQuery, "user job list query must be executed");
assert.deepEqual(jobQuery.values, [regularUser.id],
  "client-supplied user_id must never override authenticated session scope");

const hiddenChapter = await call("/api/chapters/42", null);
assert.equal(hiddenChapter.response.status, 404);
const chapterQuery = hiddenChapter.DB.calls.find(entry => entry.sql.includes("FROM chapters c JOIN novels n"));
assert.ok(chapterQuery);
assert.ok(chapterQuery.sql.includes("n.publication_status='published'"));
assert.ok(chapterQuery.sql.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"));

const fractionalRating = await call("/api/rating", regularUser, {
  method:"POST",
  body:JSON.stringify({ novel_id:42, rating:7.5 })
});
assert.equal(fractionalRating.response.status, 400);
assert.match(fractionalRating.payload.error, /whole number from 1-10/);
assert.equal(fractionalRating.DB.calls.some(entry => entry.sql.includes("INSERT INTO ratings")), false,
  "invalid fractional ratings must not reach the write query");

const unavailableBookmark = await call("/api/bookmark", regularUser, {
  method:"POST",
  body:JSON.stringify({ novel_id:42, chapter_number:3 })
});
assert.equal(unavailableBookmark.response.status, 404);
assert.equal(unavailableBookmark.DB.calls.some(entry => entry.sql.includes("INSERT INTO bookmarks")), false,
  "bookmark writes must not persist for unavailable or rights-ineligible novels");

console.log("PASS: Worker runtime authorization tests for admin denial, author object ownership, user-scoped jobs, rights-gated chapters, whole-number ratings, and bookmark eligibility.");
