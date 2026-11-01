import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../migrations/0012_novel_ownership_transfers.sql", import.meta.url), "utf8");
const required = [
  "CREATE TABLE IF NOT EXISTS novel_ownership_transfers",
  "CHECK (status IN ('pending','accepted','rejected','cancelled','expired'))",
  "CHECK (from_user_id <> to_user_id)",
  "CHECK (expires_at > requested_at)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_novel_ownership_transfer_pending",
  "ON novel_ownership_transfers(novel_id)",
  "WHERE status = 'pending'",
  "idx_ownership_transfer_recipient",
  "idx_ownership_transfer_owner",
  "idx_ownership_transfer_novel_history",
  "idx_ownership_transfer_expiry"
];
for (const fragment of required) assert.ok(sql.includes(fragment), `ownership transfer migration must include: ${fragment}`);
assert.ok(sql.includes("BEFORE UPDATE OF status ON novel_ownership_transfers"), "ownership mutation must only run from accepted transfer transition");
assert.ok(sql.includes("WHEN NEW.status = 'accepted' AND OLD.status = 'pending'"), "only pending invitations may trigger ownership mutation");
assert.ok(sql.includes("RAISE(ABORT, 'ownership transfer eligibility changed')"), "invalid recipient or novel state must abort acceptance");
assert.ok(sql.includes("recipient.role = 'author'") && sql.includes("recipient.banned = 0"), "recipient must remain an active approved author at acceptance");
console.log("Novel ownership transfer migration guard tests passed.");
