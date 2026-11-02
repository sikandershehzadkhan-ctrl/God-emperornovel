import assert from "node:assert/strict";
import fs from "node:fs";

const worker=fs.readFileSync("src/index.js","utf8");
const app=fs.readFileSync("public/app.js","utf8");
const shipped=fs.readFileSync("public/app-17.24.0.js","utf8");
const css=fs.readFileSync("public/app-17.24.0.css","utf8");
const migration=fs.readFileSync("migrations/0014_author_story_goals.sql","utf8");

const routeAt=worker.indexOf('if(p==="/api/author/goals"&&m==="GET")');
assert.ok(routeAt>=0,"Writing goals GET route must exist.");
const route=worker.slice(routeAt,worker.indexOf('if(p==="/api/author/planning"',routeAt));
assert.ok(route.includes("const e=author(u)"),"Goal endpoints must require an author/admin session.");
assert.ok(route.includes("WHERE g.owner_user_id=? AND n.owner_user_id=?"),"Goal reads must be scoped to the authenticated story owner.");
assert.ok(route.includes("SELECT id,?,?,?, ?,CURRENT_TIMESTAMP FROM novels WHERE id=? AND owner_user_id=?"),"Goal inserts must atomically select only stories owned by the authenticated creator.");
assert.ok(route.includes("AND EXISTS(SELECT 1 FROM novels WHERE id=excluded.novel_id AND owner_user_id=excluded.owner_user_id)"),"Goal updates must recheck ownership inside the atomic upsert.");
assert.ok(route.includes("DELETE FROM author_story_goals WHERE novel_id=? AND owner_user_id=? AND EXISTS(SELECT 1 FROM novels WHERE id=? AND owner_user_id=?)"),"Goal deletion must atomically recheck story ownership.");
assert.ok(route.includes("targetChapters>10000")&&route.includes("targetWords>5000000"),"Goal targets must have bounded integer validation.");
assert.ok(route.includes("Number.isInteger(targetChapters)")&&route.includes("Number.isInteger(targetWords)"),"Fractional targets must be rejected.");
assert.ok(route.includes("YYYY-MM-DD")&&route.includes("valid calendar date"),"Target dates must be validated.");
assert.ok(route.includes("WHERE author_story_goals.owner_user_id=excluded.owner_user_id"),"Upsert must not overwrite another owner's goal.");
assert.ok(route.includes("author_story_goal_saved")&&route.includes("author_story_goal_cleared"),"Goal changes must be audit logged.");

assert.ok(migration.includes("PRIMARY KEY")&&migration.includes("FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE"),"Goal records must be story-bound and cascade on story deletion.");
assert.ok(migration.includes("CHECK(target_chapters BETWEEN 0 AND 10000)")&&migration.includes("CHECK(target_words BETWEEN 0 AND 5000000)"),"D1 must enforce goal bounds.");
assert.ok(migration.includes("idx_author_story_goals_owner_updated"),"Owner lookup index must exist.");

assert.ok(app.includes("authorGoalsPanel")&&shipped.includes("authorGoalsPanel"),"Author Studio must render the writing goals workspace.");
assert.ok(app.includes("api('/api/author/goals'")&&shipped.includes("api('/api/author/goals'"),"Workspace must use the authenticated goals API.");
assert.ok(app.includes("esc(story.title")&&shipped.includes("esc(story.title"),"Story titles must be escaped.");
assert.ok(app.includes("authorGoalClear")&&shipped.includes("authorGoalClear"),"Creators must be able to clear goals.");
assert.ok(css.includes(".authorGoalFields")&&css.includes("@media(max-width:560px)"),"Writing goal controls must have a phone layout.");
assert.equal(app,shipped,"Source and served app JavaScript must remain identical.");

const notesAt=worker.indexOf('if(p==="/api/author/notes"&&m==="GET")');
assert.ok(notesAt>=0,"Private creator notes GET route must exist.");
const notesRoute=worker.slice(notesAt,worker.indexOf('if(p==="/api/author/planning"',notesAt));
assert.ok(notesRoute.includes("const e=author(u)"),"Private note endpoints must require author access.");
assert.ok(notesRoute.includes("pn.owner_user_id=? AND n.owner_user_id=?"),"Private note reads must be owner-scoped.");
assert.ok(notesRoute.includes("SELECT ?,n.id,?,? FROM novels n WHERE n.id=? AND n.owner_user_id=?"),"Note creation must atomically verify story ownership.");
assert.ok(notesRoute.includes("c.id=? AND c.novel_id=n.id"),"Chapter notes must verify the chapter belongs to the selected story.");
assert.ok(notesRoute.includes("note.length>4000"),"Private notes must be length-bounded.");
assert.ok(notesRoute.includes("author_private_notes.novel_id AND n.owner_user_id=?"),"Note updates and deletes must recheck story ownership.");
assert.ok(notesRoute.includes("author_private_note_created")&&notesRoute.includes("author_private_note_updated")&&notesRoute.includes("author_private_note_deleted"),"Private note mutations must be audit logged.");
assert.ok(app.includes("authorNotesPanel")&&shipped.includes("authorNotesPanel"),"Author Studio must render the private notes panel.");
assert.ok(app.includes("api('/api/author/notes'")&&shipped.includes("api('/api/author/notes'"),"Private notes UI must use the authenticated API.");
assert.ok(app.includes("esc(n.note||'')")&&shipped.includes("esc(n.note||''"),"Private note content must be escaped before rendering.");
assert.ok(app.includes("authorNoteDelete")&&shipped.includes("authorNoteDelete"),"Creators must be able to delete their notes.");
assert.ok(css.includes(".authorNoteForm")&&css.includes(".authorNoteItem"),"Private notes must have styled form and list states.");
const notesMigration=fs.readFileSync("migrations/0015_author_private_notes.sql","utf8");
assert.ok(notesMigration.includes("FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE"),"Private notes must cascade with account deletion.");
assert.ok(notesMigration.includes("CHECK(length(note) BETWEEN 1 AND 4000)"),"D1 must enforce private note length.");
assert.ok(notesMigration.includes("idx_author_private_notes_owner_story_updated")&&notesMigration.includes("idx_author_private_notes_chapter"),"Private note lookup indexes must exist.");


const readinessAt=worker.indexOf('if(p==="/api/author/readiness"&&m==="GET")');
assert.ok(readinessAt>=0,"Deterministic editorial readiness route must exist.");
const readinessRoute=worker.slice(readinessAt,worker.indexOf('if(p==="/api/author/planning"',readinessAt));
assert.ok(readinessRoute.includes("const e=author(u)"),"Readiness checks must require author access.");
assert.ok(readinessRoute.includes("FROM novels n WHERE n.owner_user_id=?"),"Readiness checks must be scoped to owned stories.");
assert.ok(readinessRoute.includes("CONTENT_FORMAT_IDS.has"),"Format readiness must use the canonical supported-format registry.");
assert.ok(readinessRoute.includes("rights_evidence")&&readinessRoute.includes("public_domain"),"Rights evidence checks must be based on recorded rights status.");
assert.ok(readinessRoute.includes("TRIM(COALESCE(c.content,''))=''"),"Draft completeness must inspect actual stored chapter content.");
assert.ok(readinessRoute.includes("attention_count"),"Readiness response must report deterministic attention counts.");
assert.ok(app.includes("authorReadinessPanel")&&shipped.includes("authorReadinessPanel"),"Author Studio must render editorial readiness.");
assert.ok(app.includes("api('/api/author/readiness')")&&shipped.includes("api('/api/author/readiness')"),"Readiness UI must use the authenticated API.");
assert.ok(app.includes("do not certify literary quality")&&shipped.includes("do not certify literary quality"),"UI must disclose the checks' limits.");
assert.ok(css.includes(".readinessMark")&&css.includes(".authorReadinessStory"),"Readiness results must have responsive presentation.");

console.log("Author writing goals, private notes and editorial readiness policy, ownership, migration, UI and asset parity checks passed.");
