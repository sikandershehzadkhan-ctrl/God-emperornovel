import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const versioned = readFileSync(new URL("../public/app-17.20.0.js", import.meta.url), "utf8");
const helperStart = app.indexOf("function initReaderNarration(");
const helperEnd = app.indexOf("\nasync function reader(){", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "narration helper must exist before the reader");
const helper = app.slice(helperStart, helperEnd);

assert.equal(app, versioned, "unversioned and versioned application entrypoints must stay byte-identical");
assert.match(app, /id="readerNarration"/, "reader must render narration controls");
assert.match(app, /d\.unlocked&&\['original','fanfiction','light_novel','web_novel'\]/, "narration must only be offered for unlocked prose formats");
assert.match(helper, /window\.speechSynthesis/, "must use the browser's speech synthesis implementation");
assert.match(helper, /window\.SpeechSynthesisUtterance/, "must use browser-provided speech utterances");
assert.match(helper, /lastIndexOf\(' ',1800\)/, "long chapters must be split into bounded speech chunks");
assert.match(helper, /speech\.pause\(\)/, "pause control must pause narration");
assert.match(helper, /speech\.resume\(\)/, "resume control must resume narration");
assert.match(helper, /speech\.cancel\(\)/, "stop and page exit must cancel narration");
assert.match(helper, /voiceschanged/, "voice list must refresh when device voices become available");
assert.match(helper, /'urdu':'ur-PK'/, "Urdu language must map to a suitable locale");
assert.match(helper, /voiceSelect\.value===''\?null/, "system default must not accidentally select the first listed voice");
assert.doesNotMatch(helper, /fetch\s*\(/, "chapter text must not be uploaded to an external narration provider");
assert.match(app, /initReaderNarration\(content,n\.language\)/, "reader must initialize narration for the current chapter");
console.log("PASS: device-native narration is limited to unlocked prose, has voice selection and pause/resume/stop, chunks long text, cancels on exit, and does not upload chapter text.");
