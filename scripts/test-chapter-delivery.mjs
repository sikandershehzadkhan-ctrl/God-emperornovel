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
console.log('Chapter delivery checks passed: bounded transient retries, accessible loading/error states, retry action, stable layout, and reduced-motion support.');
