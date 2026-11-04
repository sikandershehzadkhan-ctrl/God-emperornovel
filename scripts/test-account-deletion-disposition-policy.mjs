import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { DISPOSITION_DEPENDENCIES, digestDispositionPlan, validateDispositionItems } from "../src/account-deletion-disposition-policy.mjs";

globalThis.crypto ||= webcrypto;
const allPermissions=[...new Set(Object.values(DISPOSITION_DEPENDENCIES))];
const keys=Object.keys(DISPOSITION_DEPENDENCIES);
const items=keys.map(dependency_key=>({
 dependency_key,
 outcome:"retain",
 reason:"Retain pending verified dependency review",
 evidence_ref:null,
 policy_reference:"retention-policy-v1"
}));
const valid=validateDispositionItems(items,allPermissions);
assert.equal(valid.ok,true);
assert.equal(valid.items.length,keys.length);
assert.deepEqual(validateDispositionItems(items.slice(1),allPermissions,{requireComplete:true}).ok,false,"Incomplete final inventory must be rejected");
assert.equal(validateDispositionItems([items[0],items[0],...items.slice(2)],allPermissions).ok,false,"Duplicate dependencies must be rejected");
assert.equal(validateDispositionItems([{...items[0],outcome:"erase_everything"}],allPermissions).ok,false,"Unknown outcomes must be rejected");
assert.equal(validateDispositionItems([{...items[0],reason:" "}],allPermissions).ok,false,"Blank reasons must be rejected");
assert.equal(validateDispositionItems([{...items[0],outcome:"transfer_with_consent"}],allPermissions).ok,false,"Transfers require a consent evidence reference");
assert.equal(validateDispositionItems([items[0]],["case:disposition:finance"]).ok,false,"Wrong specialist role must be rejected");
const creatorItems=items.filter(item=>["creator_content","creator_rights","ownership_transfers"].includes(item.dependency_key));
assert.equal(validateDispositionItems(creatorItems,["case:disposition:creator"]).ok,true,"Creator specialist may validate only creator dependencies");
assert.equal(validateDispositionItems(creatorItems,["case:disposition:creator"],{requireComplete:true}).ok,false,"A specialist submission cannot claim to complete the entire inventory");
const first=await digestDispositionPlan({requestId:10,reviewId:20,baseReviewVersion:3,proposerId:4,items:valid.items});
const reordered=await digestDispositionPlan({requestId:10,reviewId:20,baseReviewVersion:3,proposerId:4,items:[...valid.items].reverse()});
assert.equal(first,reordered,"Canonical digest must be independent of input item order");
assert.match(first,/^[a-f0-9]{64}$/);
const changed=await digestDispositionPlan({requestId:10,reviewId:20,baseReviewVersion:3,proposerId:4,items:valid.items.map((item,index)=>index?item:{...item,reason:"Changed reason"})});
assert.notEqual(first,changed,"Any plan content change must change its digest");
await assert.rejects(()=>digestDispositionPlan({requestId:0,reviewId:20,baseReviewVersion:3,proposerId:4,items:valid.items}),TypeError);
console.log("PASS: disposition items enforce specialist authority, bounded outcomes, complete inventory, consent references, and deterministic content-bound SHA-256 digests.");
