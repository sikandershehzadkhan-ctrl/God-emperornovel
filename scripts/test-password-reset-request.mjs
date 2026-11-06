import assert from "node:assert/strict";
import { requestPasswordReset } from "../src/password-reset-request.mjs";

const now="2026-11-02T12:00:00.000Z";
function database({changes=1,cleanup=0}={}){
 const calls={batch:0,cleanup:0};
 return {calls,prepare(){return {bind(){return this},async run(){calls.cleanup++;return {meta:{changes:cleanup}}}}},async batch(){calls.batch++;return [{meta:{changes:1}},{meta:{changes}}]}};
}
const user={id:12,email:"recover@example.test"};
const absent=database();
assert.deepEqual(await requestPasswordReset({db:absent,env:{},user,publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(absent.calls.batch,0,"Missing provider must not invalidate existing links");
const badOrigin=database();
assert.deepEqual(await requestPasswordReset({db:badOrigin,env:{SECURITY_EMAIL:{fetch(){throw Error("unexpected")}}},user,publicOrigin:"http://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(badOrigin.calls.batch,0);
const noAccount=database({changes:0});
assert.deepEqual(await requestPasswordReset({db:noAccount,env:{SECURITY_EMAIL:{fetch(){throw Error("unexpected")}}},user,publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});
let sent;
const successDb=database();
assert.deepEqual(await requestPasswordReset({db:successDb,env:{SECURITY_EMAIL:{async fetch(request){sent=await request.json();return Response.json({ok:true})}}},user,publicOrigin:"https://novel.example",now}),{ok:true});
assert.equal(successDb.calls.batch,1);
assert.equal(sent.template,"reset_password");
assert.equal(sent.recipient,user.email);
assert.match(sent.action_url,/^https:\/\/novel\.example\/reset-password#token=[A-Za-z0-9_-]{43}$/);
assert.equal(sent.action_url.includes("?"),false);
const failureDb=database({cleanup:1});
assert.deepEqual(await requestPasswordReset({db:failureDb,env:{SECURITY_EMAIL:{async fetch(){return new Response("",{status:503})}}},user,publicOrigin:"https://novel.example",now}),{ok:false,reason:"unavailable"});
assert.equal(failureDb.calls.cleanup,1,"Delivery failure must revoke only the token issued by this request");
console.log("PASS: password-reset issuance fails closed, uses a fragment-only link, and cleans up failed delivery.");
