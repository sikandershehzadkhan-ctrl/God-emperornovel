import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const start = source.indexOf('if(p==="/api/privacy/export"&&m==="GET")');
const end = source.indexOf('if(p==="/api/profile"&&m==="GET")', start);
assert.ok(start >= 0 && end > start, "account export route must be present before profile route");
const route = source.slice(start, end);

for (const [fragment, description] of [
  ['const e=need(u);if(e)return e;', "export must require an authenticated session"],
  ['consumeAuthRateLimit(env,"privacy-export-user",String(uid),3,3600)', "account export must be throttled per account"],
  ['WHERE user_id=?', "reader-owned records must be filtered by the authenticated account"],
  ['WHERE owner_user_id=?', "AI author projects must be filtered by their owner"],
  ['ai_chapter_jobs', "account export must include owned AI chapter jobs"],
  ['ai_generation_runs', "account export must include owned AI generation history"],
  ['author_applications', "account export must include the user's author application"],
  ['ticket_ledger', "account export must include the user's financial ledger"],
  ['reading_positions', "account export must include reading progress"],
  ['account_closure_requests', "account export must include the account's own closure request history"],
  ['tickets:Number(u.tickets||0)', "account export must include the account's current Crown balance"],
  ['authored_novels', "creator export must include owned novels"],
  ['authored_chapters', "creator export must include owned chapter content"],
  ['JOIN novels n ON n.id=c.novel_id WHERE n.owner_user_id=?', "chapter export must be scoped through novel ownership"],
  ['rows.slice(0,5000)', "each collection must have a bounded export size"],
  ['truncated_collections', "the export must disclose collections that exceed the limit"],
  ['content-disposition', "the response must be a downloadable JSON attachment"],
  ['cache-control', "the export must disable caching"],
  ['vary":"Cookie"', "caches must vary by session cookie"],
  ['new Date(now()*1000).toISOString()', "the export timestamp must convert epoch seconds to UTC milliseconds"]
]) assert.ok(route.includes(fragment), description);

for (const forbidden of ["password_hash", "token_hash", "sessions", "reviewed_by", "rights_audit_log"])
  assert.ok(!route.includes(forbidden), `export must not disclose ${forbidden}`);

console.log("PASS: account data export is authenticated, account-scoped, bounded, no-store, and excludes credentials and internal review/security records.");

const privacyPage = readFileSync(new URL("../public/privacy.html", import.meta.url), "utf8");
assert.ok(privacyPage.includes('href="/api/privacy/export"'), "privacy page must expose the account data download route");
assert.ok(privacyPage.includes("You must be signed in"), "privacy page must explain the authentication requirement");

const retentionGuide = readFileSync(new URL("../docs/ACCOUNT-DATA-EXPORT.md", import.meta.url), "utf8");
assert.ok(retentionGuide.includes("Account deletion and erasure workflows are not yet implemented"), "retention guide must not imply account deletion is available");
assert.ok(retentionGuide.includes("5,000 rows"), "retention guide must document export collection limits");
assert.ok(retentionGuide.includes("Production export and recovery have not been exercised"), "retention guide must distinguish local tests from production verification");
