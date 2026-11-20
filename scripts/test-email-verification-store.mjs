import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createEmailVerificationToken, hashEmailVerificationToken, verifyEmailVerificationToken } from "../src/email-verification-token.mjs";
import { completeEmailVerification, EMAIL_VERIFICATION_COMPLETION_SQL } from "../src/email-verification-store.mjs";

const token=createEmailVerificationToken(), other=createEmailVerificationToken();
assert.match(token,/^[A-Za-z0-9_-]{43}$/); assert.notEqual(token,other);
const hash=await hashEmailVerificationToken(token);
assert.match(hash,/^[A-Za-z0-9_-]{43}$/);
assert.equal(await verifyEmailVerificationToken(token,hash),true);
assert.equal(await verifyEmailVerificationToken(other,hash),false);
assert.equal(await verifyEmailVerificationToken("bad",hash),false);
await assert.rejects(()=>hashEmailVerificationToken("!"),/Invalid email-verification token/);
assert.equal(EMAIL_VERIFICATION_COMPLETION_SQL.length,3);
const now="2026-11-02T12:00:00.000Z", tokenHash="A".repeat(43);
let statements=[];
const fake={prepare(sql){return {bind(...values){statements.push({sql,values});return this;}}},async batch(){return [{results:[{user_id:19,email_snapshot:"a@example.test"}]},{meta:{changes:1}},{meta:{changes:1}}]}};
assert.deepEqual(await completeEmailVerification(fake,{tokenHash,now}),{ok:true,userId:19});
assert.equal(statements.length,3);
for(const s of statements) assert.match(s.sql,/consumption_id=\?/);
assert.match(statements[0].sql,/expires_at>\?/);
assert.match(statements[1].sql,/lower\(trim\(email\)\)/);
assert.match(statements[1].sql,/lower\(trim\(email_snapshot\)\)/);
assert.deepEqual(await completeEmailVerification({...fake,async batch(){return [{results:[]},{meta:{changes:0}},{}]}},{tokenHash,now}),{ok:false});
assert.deepEqual(await completeEmailVerification({...fake,async batch(){return [{results:[{user_id:19}]},{meta:{changes:0}},{}]}},{tokenHash,now}),{ok:false,reason:"email_changed"});
await assert.rejects(()=>completeEmailVerification(fake,{tokenHash:"bad",now}),/Invalid email-verification token digest/);
await assert.rejects(()=>completeEmailVerification(fake,{tokenHash,now:"invalid"}),/normalized UTC timestamp/);

const migration=readFileSync(new URL("../migrations/0037_email_verification.sql",import.meta.url),"utf8");
const python=String.raw`
import json,sqlite3,sys
p=json.loads(sys.stdin.read()); db=sqlite3.connect(":memory:"); db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0)")
db.executemany("INSERT INTO users(id,email,verified) VALUES(?,?,?)",[(1,"a@example.test",1),(2,"b@example.test",0)])
db.executescript(p["migration"])
db.execute("INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,expires_at) VALUES(1,?,?,?,?)",("a@example.test","A"*43,"email_verification","2026-11-02T12:30:00.000Z"))
db.execute("INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,expires_at) VALUES(1,?,?,?,?)",("a@example.test","C"*43,"email_verification","2026-11-02T12:30:00.000Z"))
db.execute("INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,expires_at) VALUES(2,?,?,?,?)",("b@example.test","B"*43,"email_verification","2026-11-02T12:30:00.000Z"))
db.commit()
sql=p["sql"]; now="2026-11-02T12:00:00.000Z"
def finish(token,op):
 db.execute("BEGIN IMMEDIATE")
 try:
  row=db.execute(sql[0],(now,op,token,now)).fetchone()
  db.execute(sql[1],(now,token,op,token,op))
  changed=db.execute("SELECT changes()").fetchone()[0]
  db.execute(sql[2],(now,token,op,token)); db.commit()
  return (row[0],changed) if row else (None,changed)
 except: db.rollback(); raise
assert finish("A"*43,"op-a")== (1,1)
assert db.execute("SELECT email_verified_at FROM users WHERE id=1").fetchone()[0]==now
assert db.execute("SELECT COUNT(*) FROM email_verification_tokens WHERE user_id=1 AND token_hash<>? AND invalidated_at IS NOT NULL",("A"*43,)).fetchone()[0]==1
assert finish("A"*43,"op-replay")[0] is None
# A token for the old mailbox must be consumed but must not verify a subsequently changed address.
db.execute("UPDATE users SET email='new@example.test',email_verified_at=NULL WHERE id=2"); db.commit()
assert finish("B"*43,"op-b")== (2,0)
assert db.execute("SELECT email_verified_at FROM users WHERE id=2").fetchone()[0] is None
assert db.execute("SELECT verified FROM users WHERE id=1").fetchone()[0]==1
print("PASS: email verification is single-use, account-bound, email-snapshot-bound, and independent from creator/admin badge state.")
`;
const result=spawnSync("python3",["-c",python],{input:JSON.stringify({migration,sql:EMAIL_VERIFICATION_COMPLETION_SQL}),encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1);}
process.stdout.write(result.stdout);
console.log("PASS: email verification token and atomic completion tests.");
