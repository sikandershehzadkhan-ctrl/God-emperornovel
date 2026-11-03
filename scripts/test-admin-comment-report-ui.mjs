import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/admin.html", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
assert.ok(html.includes('api(\'/api/admin/comment-reports\')'), "admin panel must call the comment-report queue endpoint");
assert.ok(html.includes("r.comment_body"), "admin panel must render the API comment_body field");
assert.ok(html.includes("r.reporter_username"), "admin panel must render reporter_username");
assert.ok(html.includes("r.novel_title"), "admin panel must render novel_title");
assert.ok(html.includes("api('/api/admin/comment-reports/'+Number(id)"), "status action must call the report-specific PATCH endpoint");
assert.ok(!html.includes("api('/api/admin/community/reports'"), "stale community reports endpoint must be removed");
assert.ok(api.includes('if(p==="/api/admin/comment-reports"&&m==="GET")'), "queue endpoint must exist");
assert.ok(api.includes('^\\/api\\/admin\\/comment-reports\\/(\\d+)$'), "status endpoint must exist");
console.log("Admin comment-report UI integration checks passed.");
