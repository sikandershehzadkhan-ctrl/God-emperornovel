import assert from "node:assert/strict";
import { validateRichTextChapterContent } from "../src/rich-text-chapter-policy.mjs";
const doc=content=>JSON.stringify({type:"imperial_rich_text_chapter",version:1,doc:{type:"doc",content}});
const paragraph=content=>({type:"paragraph",content});
const text=value=>({type:"text",text:value});
const valid=doc([paragraph([text("A safe chapter.")])]);
assert.deepEqual(validateRichTextChapterContent(valid).ok,true);
assert.equal(validateRichTextChapterContent(valid).richText,true);
assert.equal(validateRichTextChapterContent("Legacy plain text with <b>literal markup</b>.").richText,false);
assert.equal(validateRichTextChapterContent(JSON.stringify({type:"some-other-json",version:1})).richText,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([text("Bold text").type?text("Bold text"):text("Bold text")])])).ok,true);
const bold=doc([paragraph([{type:"text",text:"Bold",marks:[{type:"bold"}]}])]);
assert.equal(validateRichTextChapterContent(bold).ok,true);
const link=doc([paragraph([{type:"text",text:"safe",marks:[{type:"link",attrs:{href:"https://example.com"}}]}])]);
assert.equal(validateRichTextChapterContent(link).ok,true);
for(const href of ["javascript:alert(1)","data:text/html,hello","//evil.example","https://user:pass@example.com","file:///etc/passwd"]) {
 const bad=doc([paragraph([{type:"text",text:"x",marks:[{type:"link",attrs:{href}}]}])]);
 assert.equal(validateRichTextChapterContent(bad).ok,false,href);
}
assert.equal(validateRichTextChapterContent(doc([{type:"script",content:[]}])).ok,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([text("x")])]).replace('"paragraph"','"script"')).ok,false);
assert.equal(validateRichTextChapterContent(JSON.stringify({type:"imperial_rich_text_chapter",version:2,doc:{type:"doc",content:[paragraph([text("x")])]}})).ok,false);
assert.equal(validateRichTextChapterContent("x".repeat(95001)).richText,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([text("x".repeat(20001))])])).ok,false);
const deep={type:"paragraph",content:[text("x")]};let nested=deep;for(let i=0;i<15;i++){nested={type:"blockquote",content:[nested]};}
assert.equal(validateRichTextChapterContent(doc([nested])).ok,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([{type:"text",text:"x",marks:[{type:"unknown"}]}])])).ok,false);
console.log("Structured rich-text chapter policy tests passed.");
