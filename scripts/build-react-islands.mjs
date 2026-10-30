import { build } from "esbuild";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  throw new Error("package.json must contain a semantic version before building React islands.");
}

await build({
  entryPoints: ["src/react/index.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "ImperialReactIslands",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  legalComments: "inline",
  outfile: `public/react-islands-${pkg.version}.js`,
});

console.log(`Built locally bundled React reader island for Imperial Novel ${pkg.version}.`);
