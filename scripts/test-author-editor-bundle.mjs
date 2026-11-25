import assert from "node:assert/strict";
import fs from "node:fs";
import { gzipSync } from "node:zlib";

const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const app = fs.readFileSync("public/app.js", "utf8");
const versionedApp = fs.readFileSync(`public/app-${pkg.version}.js`, "utf8");
const editorSource = fs.readFileSync("src/react/AuthorChapterEditor.jsx", "utf8");
const buildSource = fs.readFileSync("scripts/build-react-islands.mjs", "utf8");
const css = fs.readFileSync(`public/author-editor-${pkg.version}.css`, "utf8");
const entry = fs.readFileSync("public/index.html", "utf8");
const sharedIslands = fs.readFileSync("src/react/index.jsx", "utf8");
const bundlePath = `public/author-editor-${pkg.version}.js`;

assert.equal(app, versionedApp, "Editable and served application runtimes must match");
assert.equal(pkg.dependencies["@tiptap/react"], "3.35.0");
assert.equal(pkg.dependencies["@tiptap/starter-kit"], "3.35.0");
assert.equal(pkg.overrides["@tiptap/extension-bubble-menu"], "3.35.0");
assert.equal(pkg.overrides["@tiptap/extension-floating-menu"], "3.35.0");
assert.deepEqual(lock.packages[""].dependencies, pkg.dependencies,
  "Lockfile root dependencies must exactly match package.json");
const tiptapVersions = Object.entries(lock.packages)
  .filter(([path]) => path.includes("node_modules/@tiptap/"))
  .map(([, metadata]) => metadata.version);
assert.ok(tiptapVersions.length > 0, "Lockfile must contain the Tiptap dependency graph");
assert.deepEqual([...new Set(tiptapVersions)], ["3.35.0"],
  "Every installed Tiptap package must resolve to the coordinated 3.35.0 release");
assert.ok(buildSource.includes("src/react/AuthorChapterEditor.jsx"), "Editor has a separate build entry");
assert.ok(buildSource.includes("author-editor-${pkg.version}.js"), "Editor bundle is versioned");
assert.ok(buildSource.includes("gzipSync"), "Build measures compressed editor bundle size");
assert.ok(!sharedIslands.includes("AuthorChapterEditor"), "Tiptap is not added to shared reader/community islands");
assert.ok(!entry.includes("author-editor-"), "Homepage does not preload the Author Studio editor");
assert.ok(app.includes("function loadAuthorEditorBundle()"), "Editor bundle is loaded dynamically");
assert.ok(app.includes("if(!f.hidden)initAuthorChapterEditor(f)"), "Editor loads only after opening a chapter form");
assert.ok(app.includes("textarea.hidden=true;textarea.required=false"), "Textarea is hidden only after editor mount succeeds");
assert.ok(app.includes("textarea.hidden=false;textarea.required=true"), "Plain-text fallback remains available on load failure");
assert.ok(app.includes("Number(f.dataset.editorTextLength)>80000"), "Client enforces the server text-length limit before save");
assert.ok(app.includes("initComicPageComposer(f);f.onsubmit="), "Existing comic chapter composer remains separate");
assert.ok(editorSource.includes("StarterKit.configure"), "Tiptap StarterKit is configured explicitly");
assert.ok(editorSource.includes("heading: { levels: [2, 3] }"), "Only level 2 and 3 headings are enabled");
assert.ok(editorSource.includes("codeBlock: false"), "Unsupported code blocks are disabled");
assert.ok(!editorSource.includes("shouldRerenderOnTransaction: false"), "Toolbar state can update as the editor changes");
assert.ok(editorSource.includes("imperial_rich_text_chapter"), "Editor serializes the server-owned structured envelope");
assert.ok(editorSource.includes("new URL(String(value ||"), "Editor validates link URLs before serialization");
assert.ok(editorSource.includes('"aria-label": "Chapter content"'), "Editor content has an accessible label");
assert.ok(css.includes("min-width:44px") && css.includes("min-height:44px"), "Toolbar targets meet the 44px minimum");
assert.ok(css.includes("prefers-reduced-motion"), "Editor styles respect reduced-motion preferences");
assert.ok(fs.existsSync(bundlePath), "Build emits the separate editor bundle");
const bytes = fs.readFileSync(bundlePath);
const gzipBytes = gzipSync(bytes).length;
assert.ok(bytes.length < 1000000, "Editor bundle raw size stays below 1 MB");
assert.ok(gzipBytes < 250000, "Editor bundle gzip size stays below 250 KB");
console.log(`Author editor bundle checks passed: ${bytes.length} bytes raw, ${gzipBytes} bytes gzip.`);
