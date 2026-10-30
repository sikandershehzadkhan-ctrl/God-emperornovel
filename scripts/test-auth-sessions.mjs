import assert from "node:assert/strict";
import { revokeOtherSessions } from "../src/auth-sessions.mjs";

function makeDb(result) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values });
          return { async run() { return result; } };
        }
      };
    }
  };
}

const db = makeDb({ meta: { changes: 3 } });
const revoked = await revokeOtherSessions(db, 42, "current-session-hash-value-123456");
assert.equal(revoked, 3);
assert.equal(db.calls.length, 1);
assert.match(db.calls[0].sql, /DELETE FROM sessions WHERE user_id=\? AND token_hash<>\?/);
assert.deepEqual(db.calls[0].values, [42, "current-session-hash-value-123456"]);

assert.equal(await revokeOtherSessions(makeDb({ meta: { changes: 0 } }), 42, "current-session-hash-value-123456"), 0);
assert.equal(await revokeOtherSessions(makeDb({ changes: 2 }), 42, "current-session-hash-value-123456"), 2);
await assert.rejects(() => revokeOtherSessions(makeDb({ meta: { changes: 1 } }), 0, "current-session-hash-value-123456"), /user ID/);
await assert.rejects(() => revokeOtherSessions(makeDb({ meta: { changes: 1 } }), 42, "short"), /session hash/);
console.log("PASS: session revocation preserves the current token, scopes deletion to one user, and reports affected rows.");
