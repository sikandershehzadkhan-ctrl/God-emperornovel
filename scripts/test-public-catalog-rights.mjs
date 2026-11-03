import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const rights = "rights_status IN ('original','public_domain','licensed','authorized')";

const omniLocal = worker.slice(worker.indexOf("async function omniLocal"), worker.indexOf("async function omniConnectorSearch"));
assert.ok(omniLocal.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"), "OmniPortal local search must return only published, rights-cleared novels.");

const catalogRoute = worker.slice(worker.indexOf('if(p==="\/api\/novels")'), worker.indexOf('let nm=p.match'));
assert.ok(catalogRoute.includes("n.publication_status='published' AND n." + rights), "Catalog search and taxonomy filters must start from published, rights-cleared novels.");
const authorDirectory = worker.slice(worker.indexOf('if(p==="\/api\/public-authors")'), worker.indexOf('if(p==="/api/sources")'));
assert.ok(authorDirectory.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"), "Public author discovery must count only published, rights-cleared novels.");

const novelDetail = worker.slice(worker.indexOf('let nm=p.match(/^\\/api\\/novels\\/'), worker.indexOf('let cm=p.match(/^\\/api\\/chapters\\/'));
assert.ok(novelDetail.includes("publication_status=\\'published\\' AND " + rights), "Public novel detail must require published and rights-cleared status.");

const chapterDetail = worker.slice(worker.indexOf('let cm=p.match(/^\\/api\\/chapters\\/'), worker.indexOf('if(/^\\/api\\/chapters\\/\\d+\\/unlock$/.test(p)'));
assert.ok(chapterDetail.includes("n.publication_status='published' AND n." + rights), "Public chapter content must require a published, rights-cleared parent novel.");

const publicListQueries = [
  ["top-rated discovery", "ORDER BY n.rating DESC,n.views DESC LIMIT 60"],
  ["random discovery", "ORDER BY RANDOM() LIMIT 1"],
  ["personalized discovery", "ORDER BY CASE WHEN n.kind='original'"],
  ["popular discovery", "ORDER BY n.rating DESC,n.views DESC LIMIT 18"]
];
for (const [label, ending] of publicListQueries) {
  const at = worker.indexOf(ending);
  assert.ok(at >= 0, label + " query must exist.");
  const start = worker.lastIndexOf("WHERE n.publication_status='published'", at);
  assert.ok(start >= 0 && worker.slice(start, at).includes("n." + rights), label + " must exclude works without cleared rights.");
}

const follows = worker.slice(worker.indexOf('if(p==="/api/follows"&&m==="GET")'), worker.indexOf('if(p==="/api/profile"&&m==="GET")'));
assert.ok(follows.includes("n.publication_status='published' AND n." + rights), "Followed-novel listings must respect the public rights boundary.");

const routeLines = worker.split("\n");
const protectedReaderRoutes = [
  ["/api/history\"&&m===\"GET\"", "Reading history must hide works without cleared rights."],
  ["/api/history\"&&m===\"POST\"", "History writes must reject works without cleared rights."],
  ["/api/reading-position\"&&m===\"POST\"", "Reading-position writes must reject works without cleared rights."],
  ["/api/library\"&&m===\"GET\"", "Library results must hide works without cleared rights."],
  ["/api/library\"&&m===\"POST\"", "Library writes must reject works without cleared rights."],
  ["/api/bookmarks\"&&m===\"GET\"", "Bookmark results must hide works without cleared rights."],
  ["/api/novel-reactions\"&&m===\"GET\"", "Reaction reads must reject works without cleared rights."],
  ["/api/novel-reactions\"&&m===\"POST\"", "Reaction writes must reject works without cleared rights."],
  ["/api/rating\"&&m===\"GET\"", "Rating reads must reject works without cleared rights."],
  ["/api/rating\"&&m===\"POST\"", "Rating writes must reject works without cleared rights."],
  ["/api/follow\"&&m===\"POST\"", "Follow writes must reject works without cleared rights."],
  ["/api/omni/smart-unlock", "Smart unlock must reject works without cleared rights."],
  ["/unlock$/.test(p)&&m===\"POST\"", "Single chapter unlock must reject works without cleared rights."],
  ["/batch-unlock", "Batch chapter unlock must reject works without cleared rights."]
];
protectedReaderRoutes.push(
  ['/api/comments"&&m==="GET"', "Comment reads must reject works without cleared rights."],
  ['/api/comments"&&m==="POST"', "Comment writes must reject works without cleared rights."]
);
for (const [marker, message] of protectedReaderRoutes) {
  const lineIndex = routeLines.findIndex((candidate) => candidate.includes(marker));
  const routeSource = lineIndex < 0 ? "" : routeLines.slice(lineIndex, lineIndex + 3).join(" ");
  assert.ok(lineIndex >= 0 && routeSource.includes(rights), message);
}

console.log("PASS: public novel detail, chapter content, discovery lists and followed novels expose only published, rights-cleared works.");
