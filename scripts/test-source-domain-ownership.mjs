import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const registry=JSON.parse(await readFile(new URL("../docs/architecture/SHARED-SURFACE-OWNERSHIP.json",import.meta.url),"utf8"));
const files=execFileSync("git",["ls-files","-z","--","src"],{encoding:"utf8"}).split("\0").filter(Boolean);
const roots=registry.owners.flatMap(owner=>owner.paths.map(path=>({owner:owner.id,path,requiresAdr:owner.requiresAdr}))).filter(root=>root.path==="src/"||root.path.startsWith("src/"));
assert.ok(files.length>0,"tracked source inventory must not be empty");
assert.ok(!roots.some(root=>root.path==="src/"),"broad src/ catch-all owner is prohibited");
const expected={
  "worker-runtime": [
    "src/index.js"
  ],
  "route-and-sitemap": [
    "src/route-registry.mjs",
    "src/sitemap.mjs"
  ],
  "authentication-security": [
    "src/auth-password.mjs"
  ],
  "connector-security": [
    "src/connector-url-policy.mjs"
  ],
  "content-policy": [
    "src/comic-chapter-policy.mjs",
    "src/content-formats.mjs"
  ],
  "author-application-policy": [
    "src/author-application-policy.mjs"
  ],
  "donation-domain": [
    "src/donation-approval-policy.mjs",
    "src/donation-reference-index.mjs",
    "src/donation-reference-policy.mjs"
  ],
  "public-novel-projection": [
    "src/public-novel.mjs"
  ],
  "runtime-schema": [
    "src/runtime-feature-schema.mjs"
  ],
  "reader-community-components": [
    "src/react/"
  ]
};
for(const file of files){const matches=roots.filter(root=>root.path.endsWith("/")?file.startsWith(root.path):file===root.path);assert.equal(matches.length,1,file+" must have exactly one source owner");assert.equal(matches[0].requiresAdr,true,file+" requires ADR/feature-contract governance");}
for(const [id,paths] of Object.entries(expected)){const owner=registry.owners.find(item=>item.id===id);assert.ok(owner,"missing source owner "+id);assert.deepEqual(owner.paths,paths,"source ownership drift: "+id);}
console.log("PASS: "+files.length+" tracked source files assigned to 10 explicit source-domain owners.");
