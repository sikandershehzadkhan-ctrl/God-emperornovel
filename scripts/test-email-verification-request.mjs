import assert from "node:assert/strict";
import { requestEmailVerification } from "../src/email-verification-request.mjs";

const now="2026-11-02T12:00:00.000Z";
function database({issueChanges=1,cleanupChanges=1}={}) {
  const calls={batch:0,cleanup:0,statements:[]};
  return {calls,prepare(sql){return {sql,values:[],bind(...values){this.values=values;return this;},async run(){calls.cleanup++;return {meta:{changes:cleanupChanges}};}};},async batch(statements){calls.batch++;calls.statements=statements;return [{meta:{changes:1}},{meta:{changes:issueChanges}}];}};
}
const user={id:8,email:"reader@example.test",email_verified_at:null};
const absent=database();
assert.deepEqual(await requestEmailVerification({db:absent,env:{},user,publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(absent.calls.batch,0,"no provider must not issue a token or invalidate an older one");

const badOrigin=database();
assert.deepEqual(await requestEmailVerification({db:badOrigin,env:{SECURITY_EMAIL:{fetch(){throw new Error("must not call");}}},user,publicOrigin:"http://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(badOrigin.calls.batch,0);

const noIssue=database({issueChanges:0});
assert.deepEqual(await requestEmailVerification({db:noIssue,env:{SECURITY_EMAIL:{fetch(){throw new Error("must not call");}}},user,publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});

let sentPayload;
const successDb=database();
const success=await requestEmailVerification({db:successDb,env:{SECURITY_EMAIL:{async fetch(request){sentPayload=await request.json();return Response.json({ok:true});}}},user,publicOrigin:"https://novel.example",now});
assert.deepEqual(success,{ok:true});
assert.equal(successDb.calls.batch,1);
assert.equal(successDb.calls.cleanup,0);
assert.equal(sentPayload.template,"verify_email");
assert.equal(sentPayload.recipient,"reader@example.test");
assert.match(sentPayload.action_url,/^https:\/\/novel\.example\/verify-email#token=[A-Za-z0-9_-]{43}$/);
assert.equal(sentPayload.action_url.includes("?"),false);
assert.equal("token" in success,false,"bearer token must not be returned to caller");

const failedDb=database();
const failed=await requestEmailVerification({db:failedDb,env:{SECURITY_EMAIL:{async fetch(){return Response.json({ok:false},{status:503});}}},user,publicOrigin:"https://novel.example",now});
assert.deepEqual(failed,{ok:false,reason:"unavailable"});
assert.equal(failedDb.calls.batch,1);
assert.equal(failedDb.calls.cleanup,1,"delivery failure revokes only the issued token");

const verifiedDb=database();
assert.deepEqual(await requestEmailVerification({db:verifiedDb,env:{SECURITY_EMAIL:{fetch(){throw new Error("must not call");}}},user:{...user,email_verified_at:now},publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(verifiedDb.calls.batch,0);
console.log("PASS: email verification request orchestration fails closed without a provider, keeps bearer tokens private, and cleans up delivery failures.");
