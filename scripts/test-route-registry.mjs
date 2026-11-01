'use strict';
const assert=require('node:assert/strict');
const routes=require('../public/route-registry.js');
const cases=[
 ['/','home',{}],
 ['/discover/','discover',{}],
 ['/catalog','catalog-legacy',{}],
 ['/novel/42','novel-detail',{novelId:'42'}],
 ['/novel/42/chapters','novel-chapters',{novelId:'42'}],
 ['/read/42/7','chapter-reader',{novelId:'42',chapterId:'7'}],
 ['/library','library',{}],
 ['/messages','messages',{}],
 ['/author/novels/new','author-novel-create',{}],
 ['/author/novels/19/edit','author-novel-edit',{novelId:'19'}],
 ['/author/some-writer','author-profile',{slug:'some-writer'}],
 ['/admin/security','admin-security',{}]
];
for(const [path,id,params] of cases){
 const result=routes.resolve(path);
 assert.ok(result,'route should resolve: '+path);
 assert.equal(result.id,id,'route id for '+path);
 assert.deepEqual({...result.params},params,'route params for '+path);
}
assert.equal(routes.resolve('/not-a-real-page'),null);
assert.equal(routes.resolve('/read/42/7/extra'),null);
assert.equal(routes.resolve('/novel/%2F/chapters'),null);
assert.equal(routes.resolve('/library/').canonical,'/library');
assert.equal(routes.routes.length,34);
console.log('Imperial Novel route registry: '+cases.length+' route cases and negative cases passed.');
