import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html,app,css]=await Promise.all([
 readFile(new URL("../public/index.html",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8")
]);
assert.ok(html.includes("/app-17.23.0.js"),"HTML must load the refreshed client bundle");
assert.equal(html.split("/app-17.23.0.js").length-1,1,"HTML must reference the current versioned client bundle exactly once");
assert.ok(app.includes("id=\"homeConnections\""),"Homepage must expose the connected discovery region");
assert.ok(app.includes("/api/discovery/graph?limit=60"),"Homepage must use the bounded live graph endpoint");
assert.ok(app.includes("node.type==='genre'||node.type==='tag'"),"Only catalog genres and tags should become discovery links");
assert.ok(app.includes("encodeURIComponent(node.slug)"),"Discovery slugs must be URL encoded");
assert.ok(app.includes("esc(node.label)"),"Catalog labels must be HTML escaped before rendering");
assert.ok(app.includes("Connected discovery is temporarily unavailable"),"Graph failure must have a graceful fallback");
assert.ok(app.includes("Number.isFinite(rating)&&rating>0"),"Story cards must show ratings only when a real positive rating is present");
assert.ok(app.includes("Number.isFinite(chapters)&&chapters>0"),"Story cards must show chapter counts only when a real positive count is present");
assert.ok(app.includes("metadata?\x60<div class=\"meta\">"),"Story cards must omit the metadata row when both statistics are unavailable");
assert.ok(!app.includes("Number(n.rating||0).toFixed(1)"),"Missing ratings must never be presented as a fabricated zero-star score");
assert.ok(!app.includes("n.chapter_count||n.latest_chapter||0"),"Missing chapter counts must never be presented as zero chapters");
assert.ok(css.includes(".homeConnectionShelf")&&css.includes("@media(max-width:640px)"),"Connected discovery shelf needs responsive styling");
console.log("Homepage connected-discovery integration tests passed: versioned entry, live bounded graph, safe taxonomy links, escaped labels and graceful fallback.");
