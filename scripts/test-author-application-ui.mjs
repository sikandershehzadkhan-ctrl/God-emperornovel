import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const app = fs.readFileSync("public/app.js", "utf8");
const admin = fs.readFileSync("public/admin.html", "utf8");
const worker = fs.readFileSync("src/index.js", "utf8");
const migration = fs.readFileSync("migrations/0011_author_applications.sql", "utf8");

assert.ok(app.includes("async function authorApplicationPage(user)"), "Reader accounts need a real creator application page.");
assert.ok(app.includes("api('/api/author/applications/me')"), "The author page must retrieve the current application status.");
assert.ok(app.includes("api('/api/author/applications'"), "The author page must submit applications to the backend.");
assert.ok(app.includes("me.user.role!=='author'&&me.user.role!=='admin'"), "Non-author accounts must be routed to the application flow.");
assert.ok(admin.includes('data-tab="authorApplications"'), "Admin navigation must expose author applications.");
assert.ok(admin.includes('id="authorApplicationsBody"'), "Admin dashboard must render the application review queue.");
assert.ok(admin.includes("async function loadAuthorApplications()"), "Admin dashboard must load pending applications.");
assert.ok(admin.includes("async function reviewAuthorApplication(id,decision)"), "Admin dashboard must support review decisions.");
assert.ok(worker.includes('/api/author/applications/me') && worker.includes('/api/admin/author-applications'), "Worker must expose applicant and admin review endpoints.");
assert.ok(worker.includes("validateAuthorApplicationDecision"), "Worker must validate review decisions server-side.");
assert.ok(migration.includes("idx_author_applications_one_pending"), "Database must enforce one pending application per user.");

const scripts = [...admin.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(code => code.trim());
assert.ok(scripts.length, "Admin dashboard must contain its application script.");
new vm.Script(scripts.at(-1), { filename: "public/admin.html:inline-script" });

console.log("Author application UI and admin script checks passed.");
