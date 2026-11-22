import { build } from "esbuild";
import fs from "node:fs";
import { gzipSync } from "node:zlib";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!/^\\d+\\.\\d+\\.\\d+$/.test(pkg.version)) {
  throw new Error("package.json must contain a semantic version before building React islands.");
}

const sharedOptions = {
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  legalComments: "inline"
};

await build({
  ...sharedOptions,
  entryPoints: ["src/react/index.jsx"],
  globalName: "ImperialReactIslands",
  outfile: `public/react-islands-${pkg.version}.js`
});

const editorPath = `public/author-editor-${pkg.version}.js`;
await build({
  ...sharedOptions,
  entryPoints: ["src/react/AuthorChapterEditor.jsx"],
  globalName: "ImperialAuthorEditor",
  outfile: editorPath
});

const editorBytes = fs.readFileSync(editorPath);
const editorGzipBytes = gzipSync(editorBytes).length;
console.log(`Built reader islands for Imperial Novel ${pkg.version}.`);
console.log(`Built Author Studio-only Tiptap bundle: ${editorBytes.length} bytes raw, ${editorGzipBytes} bytes gzip.`);
