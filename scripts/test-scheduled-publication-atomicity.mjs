import assert from "node:assert/strict";
import { publishDueChapters } from "../src/domains/publishing/scheduled-chapter-publication.mjs";

function makeDb(chapterChanges) {
  const batchStatements = [];
  let dueQuery = "";
  const db = {
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async all() {
          dueQuery = this.sql;
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
      return statement;
    },
    async batch(batch) {
      batchStatements.push(...batch.map(item => ({ sql: item.sql, values: item.values })));
      return batch.map(() => ({ meta: { changes: chapterChanges } }));
    }
  };
  return { DB: db, batchStatements, get dueQuery() { return dueQuery; } };
}

const allow = () => true;
let notices = 0;
const successEnv = makeDb(1);
const count = await publishDueChapters(successEnv, {
  canPublishChapter: allow,
  notifyUser: async () => { notices += 1; }
});
assert.equal(count, 1, "one successful chapter transition is counted");
assert.equal(notices, 1, "a successful chapter transition sends one notification");
assert.match(successEnv.dueQuery, /n\.id AS novel_id/, "the due-row projection includes the parent novel identifier");
assert.equal(successEnv.batchStatements.length, 4, "publication, schedule cleanup, parent update and audit are one ordered batch");
assert.match(successEnv.batchStatements[0].sql, /UPDATE chapters[\s\S]*publication_status = 'published'/);
assert.match(successEnv.batchStatements[1].sql, /DELETE FROM scheduled_chapter_publications[\s\S]*changes\(\) = 1/);
assert.match(successEnv.batchStatements[2].sql, /UPDATE novels[\s\S]*changes\(\) = 1/);
assert.match(successEnv.batchStatements[3].sql, /INSERT INTO audit_logs[\s\S]*changes\(\) = 1/);
assert.deepEqual(successEnv.batchStatements[2].values, [12], "the parent novel update receives the selected novel id");
assert.deepEqual(successEnv.batchStatements[3].values, [9, "author_chapter_scheduled_published", "chapter=71"]);

notices = 0;
const racedEnv = makeDb(0);
const racedCount = await publishDueChapters(racedEnv, {
  canPublishChapter: allow,
  notifyUser: async () => { notices += 1; }
});
assert.equal(racedCount, 0, "a lost concurrent publication race is not counted");
assert.equal(notices, 0, "a lost race does not notify the author");

const deniedEnv = makeDb(1);
const deniedCount = await publishDueChapters(deniedEnv, {
  canPublishChapter: () => false,
  notifyUser: async () => { notices += 1; }
});
assert.equal(deniedCount, 0, "ineligible publication is skipped");
assert.equal(deniedEnv.batchStatements.length, 0, "ineligible publication performs no writes");

console.log("Publishing scheduled-chapter atomicity checks passed.");
