import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  issueEmailVerificationToken,
  invalidateEmailVerificationToken,
  EMAIL_VERIFICATION_ISSUANCE_SQL,
  EMAIL_VERIFICATION_INVALIDATION_SQL
} from "../src/email-verification-store.mjs";

const now="2026-11-02T12:00:00.000Z", expiresAt="2026-11-02T12:30:00.000Z";
const tokenHash="A".repeat(43);
let batchStatements=[];
const fake={
 prepare(sql){return {sql,values:[],bind(...values){this.values=values;return this;},async run(){return {meta:{changes:1}}};}},
 async batch(statements){batchStatements=statements;return [{meta:{changes:1}},{meta:{changes:1}}];}
};
assert.deepEqual(await issueEmailVerificationToken(fake,{userId:7,emailSnapshot:" USER@example.test ",tokenHash,now,expiresAt}),{ok:true});
assert.equal(batchStatements.length,2);
assert.equal(batchStatements[0].sql,EMAIL_VERIFICATION_ISSUANCE_SQL[0]);
assert.equal(batchStatements[1].sql,EMAIL_VERIFICATION_ISSUANCE_SQL[1]);
assert.deepEqual(batchStatements.map(x=>x.values),[[now,7],[7,"user@example.test",tokenHash,now,expiresAt,7,"user@example.test"]]);
assert.deepEqual(await issueEmailVerificationToken({...fake,async batch(){return [{meta:{changes:1}},{meta:{changes:0}}];}},{userId:7,emailSnapshot:"user@example.test",tokenHash,now,expiresAt}),{ok:false});
assert.deepEqual(await invalidateEmailVerificationToken(fake,{tokenHash,now}),{ok:true});
assert.equal(EMAIL_VERIFICATION_INVALIDATION_SQL.includes("token_hash=?"),true);
assert.deepEqual(await invalidateEmailVerificationToken({...fake,prepare(sql){return {bind(){return {async run(){return {meta:{changes:0}}};}}};}},{tokenHash,now}),{ok:false});
await assert.rejects(()=>issueEmailVerificationToken(fake,{userId:0,emailSnapshot:"user@example.test",tokenHash,now,expiresAt}),/valid user id/);
await assert.rejects(()=>issueEmailVerificationToken(fake,{userId:7,emailSnapshot:"user@example.test",tokenHash,now,expiresAt:"2026-11-02T14:00:00.000Z"}),/within one hour/);
await assert.rejects(()=>issueEmailVerificationToken(fake,{userId:7,emailSnapshot:"user@example.test",tokenHash:"bad",now,expiresAt}),/token digest/);

const migration=readFileSync(new URL("../migrations/0010_email_verification.sql",import.meta.url),"utf8");
const python=String.raw`
import json,sqlite3,sys
p=json.loads(sys.stdin.read()); db=sqlite3.connect(":memory:"); db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0)")
db.executemany("INSERT INTO users(id,email,verified) VALUES(?,?,?)",[(1,"a@example.test",0),(2,"b@example.test",0)])
db.executescript(p["migration"])
db.commit()
now="2026-11-02T12:00:00.000Z"; exp="2026-11-02T12:30:00.000Z"
issue=p["issue"]; revoke=p["revoke"]
def issue_token(uid,email,digest):
 db.execute("BEGIN IMMEDIATE")
 try:
  db.execute(issue[0],(now,uid))
  db.execute(issue[1],(uid,email,digest,now,exp,uid,email))
  changed=db.execute("SELECT changes()").fetchone()[0]
  db.commit(); return changed
 except: db.rollback(); raise
assert issue_token(1,"a@example.test","A"*43)==1
assert issue_token(1,"a@example.test","B"*43)==1
rows=db.execute("SELECT token_hash,invalidated_at FROM email_verification_tokens WHERE user_id=1 ORDER BY id").fetchall()
assert rows[0][0]=="A"*43 and rows[0][1] is not None
assert rows[1][0]=="B"*43 and rows[1][1] is None
assert issue_token(2,"wrong@example.test","C"*43)==0
assert db.execute("SELECT COUNT(*) FROM email_verification_tokens WHERE user_id=2").fetchone()[0]==0
db.execute(revoke,(now,"B"*43)); assert db.execute("SELECT invalidated_at FROM email_verification_tokens WHERE token_hash=?",("B"*43,)).fetchone()[0]==now
# A delivery failure for old A cannot invalidate the newer B token.
db.execute(revoke,(now,"A"*43))
assert db.execute("SELECT invalidated_at FROM email_verification_tokens WHERE token_hash=?",("B"*43,)).fetchone()[0]==now
print("PASS: issuance atomically replaces prior active links, binds to the current unverified mailbox, and revokes only the failed token.")
`;
const result=spawnSync("python3",["-c",python],{input:JSON.stringify({migration,issue:EMAIL_VERIFICATION_ISSUANCE_SQL,revoke:EMAIL_VERIFICATION_INVALIDATION_SQL}),encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1);}
process.stdout.write(result.stdout);
console.log("PASS: email verification issuance and delivery-failure cleanup contract tests.");
