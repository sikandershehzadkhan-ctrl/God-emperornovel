import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

for (const marker of [
  "ownershipTransferPanel",
  "ownershipTransferForm",
  "ownershipTransferList",
  "loadTransfers()",
  "transferAccept",
  "transferReject",
  "transferCancel",
  "recipient_user_id",
  "transferRecipientUsername",
  "lookupTransferRecipient",
  "/api/author/eligible-recipients?username=",
  "Ownership will not change until they accept."
]) assert.ok(app.includes(marker), "Author Studio ownership UI is missing: " + marker);

assert.match(app, /api\('\/api\/author\/ownership-transfers'\)/);
assert.match(app, /\/api\/author\/novels\/['"]\+novelId\+['"]\/ownership-transfer/);
assert.match(app, /\/api\/author\/ownership-transfers\/['"]\+Number\(btn\.dataset\.id\)\+['"]\/decision/);
assert.match(app, /\/api\/author\/ownership-transfers\/['"]\+Number\(btn\.dataset\.id\)\+['"]\/cancel/);

const decisionRoute = worker.slice(worker.indexOf('let transferDecision='), worker.indexOf('let transferCancel='));
assert.match(decisionRoute, /transfer\.to_user_id\)!==Number\(u\.id\)/);
assert.match(decisionRoute, /status='accepted'.*WHERE id=\? AND to_user_id=\? AND status='pending'/s);
assert.match(decisionRoute, /status='rejected'.*WHERE id=\? AND to_user_id=\? AND status='pending'/s);
assert.match(worker, /WHERE id=\? AND from_user_id=\? AND status='pending'/);
assert.match(worker, /Only the requesting owner can cancel/);

const listRoute = worker.slice(worker.indexOf('if(p==="/api/author/ownership-transfers"'), worker.indexOf('let transferRequest='));
assert.match(listRoute, /WHERE t\.from_user_id=\? OR t\.to_user_id=\?/);
const lookupRoute = worker.slice(worker.indexOf('if(p==="/api/author/eligible-recipients"'), worker.indexOf('let transferRequest='));
assert.ok(lookupRoute.includes("username=? COLLATE NOCASE AND role='author' AND banned=0 AND id<>?"));
assert.ok(lookupRoute.includes("username=? COLLATE NOCASE AND role='author' AND banned=0 AND id<>?"));
assert.doesNotMatch(lookupRoute, /email|password_hash/);
const transferRoutes = worker.slice(worker.indexOf('let transferRequest='), worker.indexOf('if(p==="/api/author/novels"&&m==="GET")'));
assert.equal((transferRoutes.split('await audit(env,u,"novel_ownership_transfer_').length-1, 4);
assert.doesNotMatch(transferRoutes, /INSERT INTO audit_logs/);
console.log("Author Studio ownership-transfer interface and API authorization wiring checks passed.");
