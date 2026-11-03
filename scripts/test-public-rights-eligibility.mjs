import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const rights = "rights_status IN ('original','public_domain','licensed','authorized')";
const checks = [
  ["catalog search", "FROM novels n WHERE n.publication_status='published' AND n."+rights],
  ["novel detail", "SELECT * FROM novels WHERE id=? AND publication_status=\\'published\\' AND rights_status IN (\\'original\\',\\'public_domain\\',\\'licensed\\',\\'authorized\\')"],
  ["chapter read", "n.publication_status='published' AND n."+rights+" AND c.publication_status='published'"],
  ["chapter unlock", "WHERE c.id=? AND n.publication_status='published' AND n."+rights+" AND c.publication_status='published'"],
  ["batch unlock", "SELECT id FROM novels WHERE id=? AND publication_status='published' AND "+rights],
  ["author directory", "FROM novels WHERE publication_status='published' AND "+rights],
  ["local OmniPortal search", "FROM novels WHERE publication_status='published' AND "+rights],
  ["history shelf", "WHERE h.user_id=? AND n.publication_status='published' AND n."+rights],
  ["library shelf", "WHERE l.user_id=? AND n.publication_status='published' AND n."+rights],
  ["bookmarks shelf", "WHERE b.user_id=? AND n.publication_status='published' AND n."+rights],
  ["leaderboard", "WHERE n.publication_status='published' AND n."+rights+" GROUP BY n.id"],
  ["tier list", "WHERE n.publication_status='published' AND n."+rights+" GROUP BY n.id"],
  ["random discovery", "WHERE n.publication_status='published' AND n."+rights+" GROUP BY n.id ORDER BY RANDOM()"],
  ["personalized discovery", "WHERE n.publication_status='published' AND n."+rights+" AND n.id NOT IN"],
  ["anonymous discovery", "WHERE n.publication_status='published' AND n."+rights+" GROUP BY n.id ORDER BY n.rating"],
  ["stored recommendations", "WHERE r.user_id=? AND n.publication_status='published' AND n."+rights],
  ["followed stories", "WHERE f.user_id=? AND n.publication_status='published' AND n."+rights],
  ["novel reactions", "SELECT id FROM novels WHERE id=? AND publication_status='published' AND "+rights],
  ["HTML SEO metadata", "SELECT title,author,description FROM novels WHERE id=? AND publication_status='published' AND "+rights]
];
for (const [name, fragment] of checks) assert.ok(worker.includes(fragment), name+" must enforce the public rights allowlist");
assert.ok(worker.includes("const eligible=await env.DB.prepare"), "reader mutations and smart-unlock must verify rights eligibility");
assert.ok(!worker.includes("AND rights_status IN ('original','public_domain','licensed','authorized') AND rights_status IN"), "rights predicates must not be duplicated");
assert.ok(!worker.includes("WHERE n.publication_status='published' GROUP BY"), "public discovery queries must not omit rights eligibility");
console.log("Public rights eligibility tests passed across discovery, reading, library, reactions, recommendations and SEO.");
