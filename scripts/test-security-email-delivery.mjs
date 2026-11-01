import assert from "node:assert/strict";
import { deliverSecurityEmail } from "../src/security-email-delivery.mjs";

const idempotencyKey=crypto.randomUUID();
const publicOrigin="https://imperialnovel.example";
const actionUrl=publicOrigin+"/verify-email#token=secret-fragment";
let received=null, calls=0;
const env={SECURITY_EMAIL:{async fetch(request){
 calls++;
 assert.equal(request.method,"POST");
 assert.equal(request.url,"https://security-email.internal/v1/send");
 assert.equal(request.headers.get("cache-control"),"no-store");
 received=await request.json();
 return Response.json({ok:true});
}}};
const message={template:"verify_email",recipient:" User@Example.test ",actionUrl,publicOrigin,idempotencyKey};
assert.deepEqual(await deliverSecurityEmail(env,message),{ok:true});
assert.equal(calls,1);
assert.deepEqual(received,{template:"verify_email",recipient:"user@example.test",action_url:actionUrl,idempotency_key:idempotencyKey});

assert.deepEqual(await deliverSecurityEmail({},message),{ok:false,reason:"unavailable"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,template:"arbitrary"}),{ok:false,reason:"invalid_message"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,recipient:"not-an-email"}),{ok:false,reason:"invalid_message"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,actionUrl:"http://imperialnovel.example/verify"}),{ok:false,reason:"invalid_message"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,actionUrl:"https://attacker.example/verify"}),{ok:false,reason:"invalid_message"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,publicOrigin:"https://imperialnovel.example/path"}),{ok:false,reason:"invalid_message"});
assert.deepEqual(await deliverSecurityEmail(env,{...message,idempotencyKey:"not-a-uuid"}),{ok:false,reason:"invalid_message"});
assert.equal(calls,1,"invalid messages must not reach the delivery binding");

const unavailable={SECURITY_EMAIL:{async fetch(){return new Response("provider details must not escape",{status:503});}}};
assert.deepEqual(await deliverSecurityEmail(unavailable,message),{ok:false,reason:"unavailable"});
const malformed={SECURITY_EMAIL:{async fetch(){return new Response("not json",{status:200});}}};
assert.deepEqual(await deliverSecurityEmail(malformed,message),{ok:false,reason:"unavailable"});
const failed={SECURITY_EMAIL:{async fetch(){throw new Error("secret provider diagnostic");}}};
assert.deepEqual(await deliverSecurityEmail(failed,message),{ok:false,reason:"unavailable"});
console.log("PASS: security email delivery is fail-closed, template-restricted, origin-bound, idempotency-keyed, and provider-error-sanitized.");
