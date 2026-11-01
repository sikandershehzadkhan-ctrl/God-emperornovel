import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { PASSWORD_RESET_ISSUANCE_SQL, issuePasswordResetToken, invalidatePasswordResetToken } from "../src/password-reset-store.mjs";

const valid={userId:9,tokenHash:"A".repeat(43),now:"2026-11-02T12:00:00.000Z",expiresAt:"2026-11-02T12:30:00.000Z"};
let batches=0,prepared=[];
const fake={prepare(sql){return {sql,bind(...values){prepared.push({sql,values});return this},async run(){return {meta:{changes:1}}}}},async batch(statements){batches++;assert.equal(statements.length,2);return [{meta:{changes:1}},{meta:{changes:1}}]}};
assert.deepEqual(await issuePasswordResetToken(fake,valid),{ok:true});
assert.equal(batches,1);
assert.deepEqual(await issuePasswordResetToken({...fake,async batch(){return [{meta:{changes:1}},{meta:{changes:0}}]}},valid),{ok:false});
await assert.rejects(()=>issuePasswordResetToken(fake,{...valid,userId:0}),/valid user id/);
await assert.rejects(()=>issuePasswordResetToken(fake,{...valid,expiresAt:"2026-11-02T14:00:00.000Z"}),/within one hour/);
assert.deepEqual(await invalidatePasswordResetToken(fake,{tokenHash:valid.tokenHash,now:valid.now}),{ok:true});
assert.equal(PASSWORD_RESET_ISSUANCE_SQL.length,2);

const python=String.raw`
import json,sqlite3,sys
p=json.loads(sys.stdin.read()); db=sqlite3.connect(":memory:")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY);")
db.executescript(p["migration"])
db.execute("INSERT INTO users(id) VALUES(9)")
db.execute("INSERT INTO password_reset_tokens(user_id,token_hash,purpose,created_at,expires_at) VALUES(9,?,'password_reset',?,?)",("B"*43,"2026-11-02T11:00:00.000Z","2026-11-02T11:30:00.000Z"))
db.commit()
s=p["sql"]; now="2026-11-02T12:00:00.000Z"
db.execute(s[0],(now,9,9))
db.execute(s[1],(9,"A"*43,now,"2026-11-02T12:30:00.000Z",9))
assert db.execute("SELECT invalidated_at FROM password_reset_tokens WHERE token_hash=?",("B"*43,)).fetchone()[0]==now
assert db.execute("SELECT COUNT(*) FROM password_reset_tokens WHERE token_hash=?",("A"*43,)).fetchone()[0]==1
# Missing user cannot invalidate or issue.
db.execute(s[0],(now,404,404)); db.execute(s[1],(404,"C"*43,now,"2026-11-02T12:30:00.000Z",404))
assert db.execute("SELECT COUNT(*) FROM password_reset_tokens WHERE token_hash=?",("C"*43,)).fetchone()[0]==0
assert db.execute("SELECT invalidated_at FROM password_reset_tokens WHERE token_hash=?",("A"*43,)).fetchone()[0] is None
print("PASS: SQLite atomic password-reset replacement, missing-account no-op, and prior-token invalidation.")
`;
const migration=(await import("node:fs")).readFileSync(new URL("../migrations/0009_password_reset_tokens.sql",import.meta.url),"utf8");
const result=spawnSync("python3",["-c",python],{input:JSON.stringify({migration,sql:PASSWORD_RESET_ISSUANCE_SQL}),encoding:"utf8"});
if(result.error)throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
console.log("PASS: password-reset issuance helper contract.");
