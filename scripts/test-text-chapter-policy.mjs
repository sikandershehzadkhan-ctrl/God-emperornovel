import assert from "node:assert/strict";
import { parseTextChapter, renderTextChapter } from "../src/text-chapter-policy.mjs";
const doc=content=>JSON.stringify({type:"imperial_text_chapter",version:1,document:{type:"doc",content}});
const good=doc([{type:"heading",attrs:{level:2},content:[{type:"text",text:"A title",marks:[{type:"bold"}]}]},{type:"paragraph",content:[{type:"text",text:"Safe & sound <script>alert(1)</script>",marks:[{type:"italic"}]}]},{type:"orderedList",attrs:{start:2},content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"First"}]}]}]}]);
assert.equal(parseTextChapter(good).ok,true);
const html=renderTextChapter(good);
assert.ok(html.includes("<h2><strong>A title</strong></h2>"));
assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
assert.ok(html.includes('<ol start="2">'));
assert.equal(renderTextChapter("legacy plain text"),null);
for(const href of ["javascript:alert(1)","data:text/html,x","//evil.example","https://user:pass@example.com/","file:///etc/passwd"]) {
 const bad=doc([{type:"paragraph",content:[{type:"text",text:"click",marks:[{type:"link",attrs:{href}}]}]}]);
 assert.equal(parseTextChapter(bad).ok,false,href);
}
assert.equal(parseTextChapter(doc([{type:"paragraph",content:[{type:"text",text:"x"}],attrs:{onclick:"alert(1)"}}])).ok,false);
assert.equal(parseTextChapter(doc([{type:"image",attrs:{src:"https://evil.example/x"}}])).ok,false);
assert.equal(parseTextChapter(doc([{type:"heading",attrs:{level:4},content:[{type:"text",text:"bad"}]}])).ok,false);
assert.equal(parseTextChapter("x".repeat(95001)).ok,false);
assert.equal(parseTextChapter(doc([{type:"paragraph",content:[{type:"text",text:""}]}])).ok,false);
console.log("Text chapter policy tests passed.");
