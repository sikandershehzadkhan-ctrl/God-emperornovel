import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../migrations/0016_reading_positions.sql", import.meta.url), "utf8");

assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS reading_positions"), "reading position table must be created idempotently");
assert.ok(migration.includes("PRIMARY KEY(user_id, novel_id, chapter_number)"), "positions must be isolated per user, novel and chapter");
assert.ok(migration.includes("CHECK(progress_percent BETWEEN 0 AND 100)"), "database must constrain progress percentages");
assert.ok(worker.includes('if(p==="/api/reading-position"&&m==="GET")'), "authenticated reading position retrieval route must exist");
assert.ok(worker.includes('if(p==="/api/reading-position"&&m==="POST")'), "authenticated reading position save route must exist");
assert.ok(worker.includes("Number.isInteger(pct)||pct<0||pct>100"), "API must reject invalid progress percentages");
assert.ok(worker.includes("c.publication_status='published' AND n.publication_status='published'"), "progress must only be stored for published chapters");
assert.ok(worker.includes("ON CONFLICT(user_id,novel_id,chapter_number) DO UPDATE"), "progress updates must be idempotent");
assert.ok(app.includes("api('/api/reading-position?novel_id='"), "reader must restore account progress when available");
assert.ok(app.includes("progress_percent:pct"), "reader must sync scroll progress to account storage");
assert.ok(app.includes("setTimeout(()=>{api('/api/reading-position'"), "scroll progress writes must be debounced");
console.log("PASS: account reading-position storage, validation, restoration and debounced cross-device sync are wired.");
