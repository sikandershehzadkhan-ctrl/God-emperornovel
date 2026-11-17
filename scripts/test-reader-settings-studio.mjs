import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("public/app.js", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const css = readFileSync("public/imperial-design-system.css", "utf8");

assert.equal(runtime, app, "The served runtime must match the editable application source.");
assert.match(app, /id="readerSettingsBtn"/, "The reader toolbar must expose a dedicated settings shortcut.");
assert.match(app, /id="readerSettingsSection"[^>]*aria-label="Reading settings"/, "The reader settings panel must have an accessible name.");
for (const theme of ["light", "dark", "midnight", "sepia", "imperial", "cosmic"]) {
  assert.ok(app.includes(`<option value="${theme}"`), `The reader must expose the ${theme} theme.`);
}
for (const control of ["readerBgColor", "readerTextColor", "readerFontSize", "readerFontFamily", "readerTextAlign", "readerLineSelect", "readerWidthSelect", "readerResetPrefs"]) {
  assert.ok(app.includes(`id="${control}"`), `Reader settings must include ${control}.`);
}
assert.match(app, /const applyCustomColor=\(kind,color\)=>\{if\(!\/\^#\[0-9a-f\]\{6\}\$\/i\.test\(color\)\)return;/,
  "Custom colours must be validated as six-digit hex values.");
assert.ok(app.includes("readerContrastStatus") && app.includes("updateReaderContrast") && app.includes("WCAG AA for normal text") && app.includes("ratio>=4.5"), "Custom reader colours must expose a live WCAG AA contrast warning.");
assert.match(app, /\$\('#readerThemeBtn'\)\.onclick=\(\)=>\{[\s\S]*?setReaderTheme\(themeNames\[\(i\+1\)%themeNames\.length\]\);updateReaderContrast\(\)\}/, "Cycling reader themes must refresh the live contrast result.");
assert.match(app, /\$\('#readerThemeSelect'\)\.onchange=\(\)=>\{setReaderTheme\(\$\('#readerThemeSelect'\)\.value\);updateReaderContrast\(\)\}/, "Selecting a reader theme must refresh the live contrast result.");
assert.match(app, /e\.key\.toLowerCase\(\)==\='t'\)\{const i=themeNames\.indexOf\(readerPage\.dataset\.readerTheme\);setReaderTheme\(themeNames\[\(i\+1\)%themeNames\.length\]\);updateReaderContrast\(\)\}/, "The keyboard theme shortcut must refresh the live contrast result.");
assert.match(app, /readerResetPrefs[\s\S]*?updateReaderContrast\(\)/, "Resetting reader settings must refresh the live contrast result.");
assert.match(app, /const prefGet=key=>\{try\{return localStorage\.getItem\(key\)\}catch\(e\)\{return null\}\}/,
  "Reader preference reads must tolerate unavailable browser storage.");
assert.match(app, /readerResetPrefs[\s\S]*?prefRemove\(k\)[\s\S]*?setReaderTheme\('dark'\)/,
  "Reset must clear reader-only preferences and restore the default theme.");
assert.match(app, /const openReaderDrawer=\(trigger,target\)=>\{[\s\S]*?drawer\.hidden=false[\s\S]*?target\.focus\(\{preventScroll:true\}\)/,
  "Opening reader settings must expose the drawer and move focus into its selected control.");
assert.match(app, /const openReaderSettings=\(\)=>openReaderDrawer\(settingsBtn,\$\('#readerThemeSelect'\)\)/,
  "The settings shortcut must focus the reader theme control.");
assert.match(app, /const closeReaderDrawer=\(restoreFocus=true\)=>\{[\s\S]*?drawer\.hidden=true[\s\S]*?if\(restoreFocus\)drawerTrigger\.focus\(\)/,
  "Closing the reader drawer must hide it and restore focus to its trigger.");
assert.match(app, /const readerStorage=\{[\s\S]*?getItem:key=>\{try\{return window\.localStorage\.getItem\(key\)\}catch\{return null\}\}/,
  "Reader session storage reads must tolerate browser storage being unavailable.");
assert.match(app, /createReaderSessionStore\(readerStorage\)/,
  "The reader session engine must use the guarded storage adapter.");
assert.match(app, /legacyStored=Number\(readerStorage\.getItem\(/,
  "Legacy progress migration must use guarded storage reads.");
assert.match(app, /guestBookmark=Number\(readerStorage\.getItem\(/,
  "Guest bookmark reads must use guarded storage reads.");
assert.match(app, /const key='readerBookmark:'\+id,previous=Number\(readerStorage\.getItem\(key\)\|\|0\);now=previous!==num;if\(now\)readerStorage\.setItem\(key,String\(num\)\);else readerStorage\.removeItem\(key\)/,
  "Guest bookmark toggles must use guarded storage writes and deletes.");
assert.match(app, /if\(!navigation\.isCurrent\(navigationToken\)\)return/,
  "Stale chapter responses must remain guarded.");
assert.match(app, /readerSessions\.write\(sessionNovelKey,num,pct\)/,
  "Reading progress must continue to use the reader session store.");
assert.match(app, /now=!!result\.bookmarked/,
  "Authenticated bookmark state must remain server-authoritative.");
assert.doesNotMatch(app, /if\(d\.unlocked\)api\('\/api\/bookmark'/,
  "Opening a chapter must not silently create a bookmark.");

for (const selector of [".readerPrefsStudio", ".readerSwatches button", ".readerColorPicker", ".readerPrefActions", ".readerPage.readerCustomColors"]) {
  assert.ok(css.includes(selector), `The unified stylesheet must include ${selector}.`);
}
assert.match(css, /\.readerPage \.readerContent\{unicode-bidi:plaintext;text-align:start\}/,
  "Mixed Urdu, Arabic, Persian and Latin paragraphs must resolve direction independently without forcing the whole chapter RTL.");
assert.match(css, /\.readerSwatches button\{width:44px;height:44px;min-width:44px;/,
  "Colour swatches must preserve 44px touch targets.");
assert.match(css, /@media\(max-width:520px\)\{[\s\S]*?\.readerPrefsStudio\{grid-template-columns:minmax\(0,1fr\)/,
  "The settings studio must collapse to a single column on narrow screens.");

console.log("Reader Settings Studio and protected reader-session integration checks passed.");
