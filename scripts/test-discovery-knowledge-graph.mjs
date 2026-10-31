import assert from "node:assert/strict";
import { buildDiscoveryGraph } from "../src/discovery-knowledge-graph.mjs";

const formats=[{id:"original",label:"Original novels"},{id:"manga",label:"Manga"}];
const graph=buildDiscoveryGraph([
 {id:12,title:"The Imperial Archive",author:"Sikander Khan",kind:"original",language:"English",description:"A story",cover_url:"/cover.webp"},
 {id:13,title:"Panels of Tomorrow",author:"Sikander Khan",kind:"manga",language:"Japanese"},
 {id:0,title:"Invalid",author:"Nobody",kind:"original"},
 {id:14,title:"Missing Author",author:"",kind:"original"}
],[
 {novel_id:12,id:1,name:"Fantasy",slug:"fantasy"},
 {novel_id:13,id:2,name:"Science Fiction",slug:"science-fiction"},
 {novel_id:999,id:3,name:"Private",slug:"private"}
],[
 {novel_id:12,id:4,name:"Empire",slug:"empire"},
 {novel_id:13,id:5,name:"Time Travel",slug:"time-travel"}
],formats);
assert.equal(graph.version,1);
assert.equal(graph.nodes.filter(x=>x.type==="novel").length,2);
assert.equal(graph.nodes.filter(x=>x.type==="author").length,1);
assert.equal(graph.nodes.filter(x=>x.type==="format").length,2);
assert.ok(graph.edges.some(x=>x.type==="created"&&x.source==="author:sikander%20khan"&&x.target==="novel:12"));
assert.ok(graph.edges.some(x=>x.type==="classified-as"&&x.target==="genre:1"));
assert.ok(graph.edges.some(x=>x.type==="tagged-with"&&x.target==="tag:4"));
assert.ok(!graph.nodes.some(x=>x.label==="Private"));
assert.equal(new Set(graph.nodes.map(x=>x.id)).size,graph.nodes.length);
assert.equal(new Set(graph.edges.map(x=>x.id)).size,graph.edges.length);
assert.ok(!graph.edges.some(x=>!graph.nodes.some(n=>n.id===x.source)||!graph.nodes.some(n=>n.id===x.target)));
console.log("Discovery knowledge graph tests passed: stable entity IDs, deduplicated authors, validated edges and relationship isolation.");
