import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const cases = [
  {
    label: "novel detail",
    marker: 'let nm=p.match(/^\\/api\\/novels\\/(\\d+)$/);if(nm){',
    next: 'let cm=p.match(/^\\/api\\/chapters\\/(\\d+)$/);',
    write: 'if(m!=="GET")return json({error:"Method not allowed"},405);'
  },
  {
    label: "chapter detail",
    marker: 'let cm=p.match(/^\\/api\\/chapters\\/(\\d+)$/);if(cm){',
    next: 'let ',
    write: 'if(m!=="GET")return json({error:"Method not allowed"},405);'
  }
];
for (const item of cases) {
  const start = source.indexOf(item.marker);
  assert.ok(start >= 0, item.label + " handler must exist");
  const end = item.label === "novel detail"
    ? source.indexOf(item.next, start + item.marker.length)
    : source.indexOf("return json({error:\"Chapter not found\"},404);", start);
  assert.ok(end > start, item.label + " handler boundary must exist");
  const handler = source.slice(start, end);
  assert.ok(handler.includes(item.write), item.label + " must reject non-GET methods before database work");
  assert.ok(handler.indexOf(item.write) < handler.indexOf("env.DB.prepare"), item.label + " method guard must precede database access");
}
console.log("PASS: novel and chapter detail endpoints reject non-GET methods before database access.");
