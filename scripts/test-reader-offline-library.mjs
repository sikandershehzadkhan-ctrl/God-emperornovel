import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const worker=fs.readFileSync('public/sw.js','utf8');
const source=fs.readFileSync('src/index.js','utf8');
const page=fs.readFileSync('public/offline.html','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');

assert.equal(app,served,'Editable and served app bundles must remain byte-identical.');
assert.ok(app.includes('async function offlineLibrary()'),'A dedicated offline library route must exist.');
assert.ok(app.includes("else if(p==='/offline')await offlineLibrary()"),'The app boot router must render the offline library.');
assert.ok(app.includes("import('/reader-offline.mjs')"),'The offline library must use the shared offline chapter store.');
assert.ok(app.includes('data-offline-library-remove'),'Each download must have an individual remove action.');
assert.ok(app.includes("clear.onclick=async()=>"),'The offline library must support removing all local downloads.');
assert.ok(app.includes("confirm('Remove all '+records.length+' offline chapter copies from this device?')"),'Bulk removal must require explicit confirmation.');
assert.ok(app.includes('item.savedAt?esc(new Intl.DateTimeFormat'),'Saved timestamps must be rendered with safe date formatting.');
assert.ok(app.includes('module.OFFLINE_TOTAL_MAX_BYTES'),'Storage usage must be derived from the store limit.');
assert.ok(app.includes('Anyone with access to this device profile may be able to read them.'),'The page must disclose local-device privacy risk.');
assert.ok(app.includes('href="/offline">Offline</a>'),'Library, history and following navigation must expose the offline page.');
assert.ok(source.includes('"/offline":"offline.html"'),'The Worker must serve the offline library shell.');
assert.ok(source.includes('"/offline"'),'The offline library must be excluded from indexing.');
assert.ok(page.includes('noindex,nofollow'),'The offline page document must be noindex.');
assert.ok(worker.includes("(readerParts[1]==='offline'&&readerParts.length===2)"),'Service worker navigation fallback must recognize /offline.');
assert.ok(worker.includes("caches.match('/')"),'Offline library navigation must fall back to the cached app shell.');
assert.ok(css.includes('.offlineLibraryItemActions a,.offlineLibraryItemActions button{min-height:44px}'),'Offline library controls must meet mobile touch target sizing.');
assert.ok(css.includes('@media(max-width:620px){.offlineLibraryItem'),'Offline library list must adapt to narrow screens.');
console.log('Dedicated offline library routing, privacy, management and responsive UI checks passed.');
