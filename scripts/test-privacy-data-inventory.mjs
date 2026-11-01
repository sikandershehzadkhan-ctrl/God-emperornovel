import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
import { join } from "node:path";

const migrationDir=new URL("../migrations/",import.meta.url);
const migrations=readdirSync(migrationDir).filter(name=>/^\d+_.*\.sql$/.test(name));
const schemaTables=new Set();
for(const name of migrations){
  const sql=readFileSync(new URL(name,migrationDir),"utf8");
  for(const match of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+([A-Za-z0-9_]+)/gi))
    schemaTables.add(match[1]);
}
const inventory=readFileSync(new URL("../docs/PRIVACY-DATA-INVENTORY.md",import.meta.url),"utf8");
const rows=new Set([...inventory.matchAll(/^\|\s*([a-z][a-z0-9_]*)\s*\|/gm)].map(match=>match[1]));
const missing=[...schemaTables].filter(name=>!rows.has(name));
const stale=[...rows].filter(name=>!schemaTables.has(name));
assert.deepEqual(missing,[],"Every table created by a numbered migration must appear in the privacy inventory");
assert.deepEqual(stale,[],"Privacy inventory must not list tables absent from numbered migrations");

const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const start=source.indexOf('if(p==="/api/privacy/export"&&m==="GET")');
const end=source.indexOf('if(p==="/api/profile"&&m==="GET")',start);
const route=source.slice(start,end);
for(const [fragment,reason] of [
  ["comment_reports_legacy_duplicates","archived user moderation reports must be exportable"],
  ["content_rights_created","creator-submitted rights records must be exportable"],
  ["WHERE created_by=?","rights evidence must be scoped to its creator"],
  ["WHERE user_id=?","archived reports must be scoped to their submitting account"],
  ["rights_audit_log","internal rights review audit must remain excluded"],
  ["reviewed_by","internal reviewer identity must remain excluded"]
])assert.ok(route.includes(fragment),reason);
assert.ok(inventory.includes("No general automatic deletion schedule"),"Inventory must not imply retention automation exists");
console.log(`PASS: privacy inventory covers all ${schemaTables.size} migrated tables and matches account export boundaries.`);
