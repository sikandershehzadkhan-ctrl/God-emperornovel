import assert from "node:assert/strict";
import { publishDueChapters } from "../src/domains/publishing/scheduled-chapter-publication.mjs";

function makeDb(chapterChanges) {
  const statements = [];
  const db = {
    prepare(sql) {
      return {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async all() {
          return { results: [{
            chapter_id: 71,
            created_by: 9,
            chapter_number: 4,
            chapter_title: "A New Dawn",
            novel_id: 12,
            novel_title: "Imperial Test",
            owner_user_id: 9,
            novel_publication_status: "published",
            rights_status: "original",
            rights_evidence: ""
          }] };
        }
      };
    },
    async batch(batch) {
      statements.push(...batch.map(item => ({ sql: item.sql, values: item.values })));
      return [{ meta: { changes: chapterChanges } }, { meta: { changes: chapterChanges } },
        { meta: { changes: chapterChanges } }, { meta: { changes: chapterChanges } }];
    }
  };
  return { DB: db, statements };
}

const allow = () => true;
let notices = 0;
const successEnv = makeDb(1);
const count = await publishDueChapters(successEnv, {
  canPublishChapter: allow,
  notifyUser: async () => { notices += 1; }
});
assert.equal(count, 1, "one successfully transitioned chapter is counted");
assert.equal(notices, 1, "only a successful chapter transition sends a notification");
assert.equal(successEnv.statements.length, 4, "publication, schedule cleanup, novel update and audit are one ordered batch");
assert.match(successEnv.statements[0].sql, /UPDATE chapters[\s\S]*publication_status = 'published'/);
assert.match(successEnv.statements[1].sql, /DELETE FROM scheduled_chapter_publications[\s\S]*changes\(\) = 1/);
assert.match(successEnv.statements[2].sql, /UPDATE novels[\s\S]*changes\(\) = 1/);
assert.match(successEnv.statements[3].sql, /INSERT INTO audit_logs[\s\S]*changes\(\) = 1/);
assert.match((await Promise.resolve(successEnv.statements[0])).sql, /UPDATE chapters/);

notices = 0;
const racedEnv = makeDb(0);
const racedCount = await publishDueChapters(racedEnv, {
  canPublishChapter: allow,
  notifyUser: async () => { notices += 1; }
});
assert.equal(racedCount, 0, "a lost race does not count as a publication");
assert.equal(notices, 0, "a lost race does not notify the author");

const deniedEnv = makeDb(1);
const deniedCount = await publishDueChapters(deniedEnv, {
  canPublishChapter: () => false,
  notifyUser: async () => { notices += 1; }
});
assert.equal(deniedCount, 0, "ineligible publication is skipped");
assert.equal(deniedEnv.statements.length, 0, "ineligible publication does not write");

console.log("Publishing scheduled-chapter atomicity checks passed.");
