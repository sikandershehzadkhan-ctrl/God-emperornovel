import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../public/app-17.23.0.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../public/app-17.23.0.css', import.meta.url), 'utf8');

assert.equal(runtime, app, 'Editable and versioned browser runtimes must remain synchronized.');
assert.match(app, /async function apiGetWithRetry\(path,attempts=3\)/, 'Chapter GET requests must use bounded retries.');
assert.match(app, /const retryable=!status\|\|status===408\|\|status===429\|\|status>=500/, 'Only network and transient HTTP failures should be retried.');
assert.match(app, /await apiGetWithRetry\('\/api\/novels\/\'\+id\)/, 'Novel metadata must load through the retry helper.');
assert.match(app, /await apiGetWithRetry\('\/api\/chapters\/\'\+ch\.id\)/, 'Chapter content must load through the retry helper.');
assert.ok(app.includes('role="status" aria-live="polite"'), 'The reader must announce its loading state accessibly.');
assert.ok(app.includes('id="retryChapterLoad"'), 'A recoverable chapter error must offer a retry action.');
assert.match(styles, /\.readerLoadState\{min-height:55vh/, 'Chapter loading and error states must have a stable layout.');
assert.match(styles, /prefers-reduced-motion:reduce\)\{\.readerLoadSpinner\{animation:none/, 'Loading animation must respect reduced-motion preferences.');
assert.match(app, /const loadToken=\(window\.__imperialReaderLoadToken\|\|0\)\+1/, 'Each reader load must receive a unique generation token.');
assert.match(app, /if\(loadToken!==window\.__imperialReaderLoadToken\)return;/, 'Stale chapter responses must not overwrite the latest reader view.');
assert.match(app, /if\(window\.__imperialReaderScrollHandler\)window\.removeEventListener\('scroll',window\.__imperialReaderScrollHandler\)/, 'Reader retries must remove the previous scroll listener.');
assert.match(app, /const root=\$\('#app'\);\s*if\(window\.__imperialReaderScrollHandler\)window\.removeEventListener\('scroll',window\.__imperialReaderScrollHandler'\)/, 'Old scroll listeners must be cleared before the loading view replaces reader content.');
assert.match(app, /if\(window\.__imperialReaderKeyHandler\)document\.removeEventListener\('keydown',window\.__imperialReaderKeyHandler\)/, 'Reader retries must remove the previous keyboard listener.');
assert.match(app, /let bookmarkSaving=false;\$\('#bookmarkBtn'\)\.onclick=async\(\)=>\{const button=\$\('#bookmarkBtn'\);if\(bookmarkSaving\|\|!button\)return;/, 'Bookmark actions must be guarded against concurrent clicks.');
console.log('Chapter delivery checks passed: bounded retries, accessible recovery, stale-response protection, listener cleanup, bookmark click locking, stable layout, and reduced motion.');
