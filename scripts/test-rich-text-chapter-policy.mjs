import assert from "node:assert/strict";
import vm from "node:vm";
import { validateRichTextChapterContent } from "../src/rich-text-chapter-policy.mjs";
const doc=content=>JSON.stringify({type:"imperial_rich_text_chapter",version:1,doc:{type:"doc",content}});
const paragraph=content=>({type:"paragraph",content});
const text=value=>({type:"text",text:value});
const valid=doc([paragraph([text("A safe chapter.")])]);
assert.deepEqual(validateRichTextChapterContent(valid).ok,true);
assert.equal(validateRichTextChapterContent(valid).richText,true);
assert.equal(validateRichTextChapterContent("Legacy plain text with <b>literal markup</b>.").richText,false);
assert.equal(validateRichTextChapterContent(JSON.stringify({type:"some-other-json",version:1})).richText,false);
const bold=doc([paragraph([{type:"text",text:"Bold",marks:[{type:"bold"}]}])]);
assert.equal(validateRichTextChapterContent(bold).ok,true);
const link=doc([paragraph([{type:"text",text:"safe",marks:[{type:"link",attrs:{href:"https://example.com"}}]}])]);
assert.equal(validateRichTextChapterContent(link).ok,true);
for(const href of ["javascript:alert(1)","data:text/html,hello","//evil.example","https://user:pass@example.com","file:///etc/passwd"]) {
 const bad=doc([paragraph([{type:"text",text:"x",marks:[{type:"link",attrs:{href}}]}])]);
 assert.equal(validateRichTextChapterContent(bad).ok,false,href);
}
assert.equal(validateRichTextChapterContent(doc([{type:"script",content:[]}])).ok,false);
assert.equal(validateRichTextChapterContent(doc([text("Not allowed at document root")])).ok,false);
assert.equal(validateRichTextChapterContent(doc([{type:"paragraph",attrs:{class:"unsafe"},content:[text("x")]}])).ok,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([text("x")])]).replace('"paragraph"','"script"')).ok,false);
assert.equal(validateRichTextChapterContent(JSON.stringify({type:"imperial_rich_text_chapter",version:2,doc:{type:"doc",content:[paragraph([text("x")])]}})).ok,false);
assert.equal(validateRichTextChapterContent("x".repeat(95001)).richText,false);
const oversized=JSON.stringify({type:"imperial_rich_text_chapter",version:1,doc:{type:"doc",content:[paragraph([text("x".repeat(80001))])]}});
assert.equal(validateRichTextChapterContent(oversized).ok,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([text("x".repeat(20001))])])).ok,false);
const deep={type:"paragraph",content:[text("x")]};let nested=deep;for(let i=0;i<15;i++){nested={type:"blockquote",content:[nested]};}
assert.equal(validateRichTextChapterContent(doc([nested])).ok,false);
assert.equal(validateRichTextChapterContent(doc([paragraph([{type:"text",text:"x",marks:[{type:"unknown"}]}])])).ok,false);

const fs = await import("node:fs");
const appSource = fs.readFileSync("public/app.js", "utf8");
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const versionedApp = fs.readFileSync("public/app-" + version + ".js", "utf8");
assert.equal(appSource, versionedApp, "Editable and served application runtimes stay identical");
assert.ok(appSource.includes("function renderRichTextNode(node)"), "Reader has a dedicated structured renderer");
assert.ok(appSource.includes("let out=esc(node.text)"), "Reader escapes every rich-text text node");
assert.ok(appSource.includes("rel=\"nofollow noopener noreferrer\""), "Reader marks external links as untrusted");


const appRuntime = fs.readFileSync("public/app.js", "utf8");
const renderStart = appRuntime.indexOf("function renderRichTextNode(node){");
const renderEnd = appRuntime.indexOf("function renderChapterContent(raw,kind){", renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart, "Reader rich-text renderer is present");
const renderSource = appRuntime.slice(renderStart, renderEnd) +
  "\nthis.renderRichTextNode=renderRichTextNode;this.renderRichTextChapter=renderRichTextChapter;";
const sandbox = {
  esc: value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char])
};
vm.runInNewContext(renderSource, sandbox);
const renderNode = sandbox.renderRichTextNode;
const renderChapter = sandbox.renderRichTextChapter;
assert.equal(
  renderNode({ type: "paragraph", content: [{ type: "text", text: '<img src=x onerror="alert(1)">' }] }),
  '<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>',
  "Author text is escaped instead of interpreted as HTML"
);
assert.equal(
  renderNode({ type: "paragraph", content: [{ type: "text", text: "unsafe", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }),
  "<p>unsafe</p>",
  "Unsafe link schemes never become anchors"
);
assert.equal(
  renderNode({ type: "paragraph", content: [{ type: "text", text: "safe", marks: [{ type: "link", attrs: { href: "https://example.com/path" } }] }] }),
  '<p><a href="https://example.com/path" rel="nofollow noopener noreferrer" target="_blank">safe</a></p>',
  "HTTP(S) links render with safe target and rel attributes"
);
assert.equal(renderNode({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "bad" }] }), null);
assert.equal(renderNode({ type: "script", content: [{ type: "text", text: "bad" }] }), null);
assert.equal(
  renderChapter(JSON.stringify({ type: "imperial_rich_text_chapter", version: 1, doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Rendered safely" }] }] } })),
  '<div class="richTextChapter"><p>Rendered safely</p></div>'
);
console.log("Structured chapter reader rendering security tests passed.");

console.log("Structured rich-text chapter policy tests passed.");
