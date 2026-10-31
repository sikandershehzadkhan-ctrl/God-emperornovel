import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDonationReferenceIndexEnsurer } from "../src/donation-reference-index.mjs";

function fakeDb({ failFirst = false } = {}) {
  const calls = [];
  let shouldFail = failFirst;
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        async run() {
          if (shouldFail) {
            shouldFail = false;
            throw new Error("temporary D1 failure");
          }
          return { meta: { changes: 0 } };
        }
      };
    }
  };
}

const db = fakeDb();
const ensure = createDonationReferenceIndexEnsurer();
await Promise.all([
  ensure({ DB: db }),
  ensure({ DB: db }),
  ensure({ DB: db })
]);
assert.equal(db.calls.length, 1, "concurrent calls must share one index initialization");
assert.match(db.calls[0], /CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_reference_normalized/);
assert.match(db.calls[0], /LOWER\(TRIM\(reference_id\)\)/);

const retryDb = fakeDb({ failFirst: true });
const retryEnsure = createDonationReferenceIndexEnsurer();
await assert.rejects(() => retryEnsure({ DB: retryDb }), /temporary D1 failure/);
await retryEnsure({ DB: retryDb });
assert.equal(retryDb.calls.length, 2, "failed initialization must be retryable");

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(worker, /createDonationReferenceIndexEnsurer/);
assert.match(worker, /const ensureDonationReferenceIndex=createDonationReferenceIndexEnsurer\(\)/);
const route = worker.indexOf('if(p==="\/api\/donations"&&m==="POST")');
assert.ok(route >= 0, "donation submission route must exist");
assert.ok(worker.indexOf("await ensureDonationReferenceIndex(env);", route) > route,
  "donation route must initialize the normalized unique index before insert");

console.log("PASS: donation index initialization is wired, concurrency-safe and retryable.");
