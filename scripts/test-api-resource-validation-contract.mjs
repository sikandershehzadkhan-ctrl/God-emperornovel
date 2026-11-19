import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const bookmarkStart = worker.indexOf('if(p==="/api/bookmark"&&m==="POST")');
const bookmarkEnd = worker.indexOf('if(p==="/api/history"&&m==="GET")', bookmarkStart);
assert.ok(bookmarkStart >= 0 && bookmarkEnd > bookmarkStart, "Bookmark route must exist");
const bookmark = worker.slice(bookmarkStart, bookmarkEnd);
for (const fragment of [
  "Number.isSafeInteger(novelId)", "Number.isSafeInteger(chapterNumber)",
  "JOIN chapters c ON c.novel_id=n.id", "n.publication_status='published'",
  "c.publication_status='published'", "n.rights_status IN ('original','public_domain','licensed','authorized')",
  ".bind(u.id,novelId,chapterNumber)"
]) assert.ok(bookmark.includes(fragment), "Bookmark contract missing: " + fragment);
const createStart = worker.indexOf('if(p==="/api/author/chapters"&&m==="POST")');
const updateStart = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH")');
const publishStart = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST")');
assert.ok(createStart >= 0 && updateStart > createStart && publishStart > updateStart, "Author chapter routes must exist");
const createRoute = worker.slice(createStart, updateStart);
const updateRoute = worker.slice(updateStart, publishStart);
assert.ok(createRoute.includes("validateComicChapterContent(content)"), "Comic creation validator must remain");
assert.ok(updateRoute.includes("SELECT c.*,n.owner_user_id,n.kind FROM chapters c JOIN novels n"), "Comic update must load parent format");
assert.ok(updateRoute.includes("validateComicChapterContent(content)"), "Comic update must use creation validator");
assert.ok(updateRoute.includes("comicCheck.ok"), "Invalid comic edits must be rejected");

const taxonomyStart = worker.indexOf("async function communityTaxonomy(req,env,u){");
const taxonomyEnd = worker.indexOf("async function adminTaxonomy", taxonomyStart);
assert.ok(taxonomyStart >= 0 && taxonomyEnd > taxonomyStart, "Community taxonomy handler must exist");
const taxonomy = worker.slice(taxonomyStart, taxonomyEnd);
assert.ok(taxonomy.includes("u?.id||null"), "Taxonomy submitter ID must come from the authenticated session");
assert.ok(taxonomy.includes("u?.username||'Guest'"), "Taxonomy submitter name must come from the authenticated session");
assert.ok(!taxonomy.includes("b.creator_id"), "Taxonomy handler must not trust client-supplied creator IDs");
assert.ok(!taxonomy.includes("b.creator_name"), "Taxonomy handler must not trust client-supplied creator names");
assert.ok(worker.includes('if(p==="/api/taxonomy")return communityTaxonomy(req,env,u);'), "Taxonomy handler must receive the server-resolved session user");

console.log("API resource-validation contract tests passed.");
