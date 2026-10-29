import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');
const registryMatch = source.match(/const CONTENT_FORMATS=(\[[\s\S]*?\n\];)/);
assert.ok(registryMatch, 'Server-owned content format registry exists');
const formats = [...registryMatch[1].matchAll(/\{id:"([a-z_]+)",label:"([^"]+)",group:"([a-z]+)"[^}]*\}/g)].map(([, id, label, group]) => ({ id, label, group }));
assert.ok(formats.length >= 12, 'Registry includes a broad set of formats');
assert.equal(new Set(formats.map(x => x.id)).size, formats.length, 'Format IDs are unique');
assert.ok(formats.every(x => x.label.trim() && x.group.trim()), 'Every format has a label and group');
assert.ok(source.includes('if(p==="/api/formats"&&m==="GET")'), 'Public format registry endpoint exists');
assert.ok(source.includes('CONTENT_FORMAT_IDS.has(kind)'), 'Publishing validates format IDs');
assert.ok(source.includes('supported_formats:CONTENT_FORMATS.map'), 'Invalid formats return accepted IDs');
assert.ok(source.includes('originHint:') && source.includes('experience:'), 'Format registry documents origin traditions and reader experiences');
for (const path of ['public/app.js', 'public/app-17.17.0.js']) {
 const app = fs.readFileSync(path, 'utf8');
 assert.ok(app.includes('aria-labelledby="homeFormatTitle"'), path + ' makes format discovery visible from the homepage');
 assert.ok(app.includes('href="/format/original"') && app.includes('href="/format/fanfiction"'), path + ' keeps original novels and fanfiction first-class homepage destinations');
}
const scriptMatch = index.match(/<script src="\/([^"]+\.js)" defer><\/script>/);
assert.ok(scriptMatch && fs.existsSync('public/' + scriptMatch[1]), 'HTML references an existing application bundle');
for (const name of new Set(['app.js', scriptMatch[1]])) {
 const app = fs.readFileSync('public/' + name, 'utf8');
 assert.ok(app.includes('async function formatDirectory()'), name + ' includes format directory');
 assert.ok(app.includes('async function formatLanding(kind)'), name + ' includes format shelves');
 assert.ok(app.includes('Playback is not enabled for this format.'), name + ' avoids implying unconfigured playback');
 assert.ok(app.includes("type!=='imperial_comic_chapter'"), name + ' validates structured comic payloads');
 assert.ok(app.includes('initComicViewer()'), name + ' initializes comic reading modes');
 assert.ok(app.includes('Switch to single-page mode'), name + ' supports single-page comic reading');
}
for (const asset of ['imperial-formats-17.17.0.css','imperial-comic-reader-17.17.0.css','manifest-17.17.0.webmanifest']) {
 assert.ok(index.includes('/'+asset), 'HTML references '+asset);
 assert.ok(fs.existsSync('public/'+asset), asset+' exists');
}

for (const path of ['public/app.js', 'public/app-17.17.0.js']) {
 const app = fs.readFileSync(path, 'utf8');
 assert.ok(app.includes('async function authorStudio()'), path + ' includes the Creator Suite');
 assert.ok(app.includes("else if(p==='/author')await authorStudio();"), path + ' routes the author workspace');
 assert.ok(app.includes("api('/api/author/novels'"), path + ' loads the signed-in author library');
 assert.ok(app.includes("api('/api/author/chapters'"), path + ' supports chapter draft creation');
 assert.ok(app.includes("rights_status!=='original'&&!payload.rights_evidence"), path + ' checks rights evidence before submitting a non-original work');
 assert.ok(app.includes('aria-live="polite"'), path + ' announces draft status updates accessibly');
 assert.ok(app.includes("api('/api/author/novels/'+Number(f.dataset.id),{method:'PATCH'"), path + ' saves story metadata through the authenticated update endpoint');
 assert.ok(app.includes("$$('.authorAddChapter',list).forEach"), path + ' binds all chapter controls as a collection');
 assert.ok(app.includes("$$('.authorCancelChapter',list).forEach"), path + ' binds all chapter cancel controls as a collection');
 assert.ok(app.includes("$$('.authorChapterForm',list).forEach"), path + ' binds all chapter forms as a collection');
 assert.ok(app.includes("$$('.authorSubmitStory',list).forEach"), path + ' binds all review submission controls as a collection');
 assert.ok(app.includes("$$('.authorEditToggle',list).forEach"), path + ' binds story edit toggles');
 assert.ok(app.includes("$$('.authorCancelEdit',list).forEach"), path + ' binds story edit cancel controls');
 assert.ok(app.includes("$$('.authorEditForm',list).forEach"), path + ' binds editable story forms');
 assert.ok(app.includes("CONTENT_FORMAT_OPTIONS.map"), path + ' populates edit format options from the canonical registry');
 assert.ok(app.includes("api('/api/formats')"), path + ' fetches canonical formats from the server registry');
 assert.ok(app.includes("id=\"storyKind\" name=\"kind\" required>'+CONTENT_FORMAT_OPTIONS.map"), path + ' builds the new-story format selector from the registry');
 assert.ok(app.includes('name="alt_titles"'), path + ' supports alternate titles');

}
assert.ok(source.includes('if(p==="/api/author/novels"&&m==="POST")'), 'Backend supports creating story drafts');
assert.ok(source.includes('if(p==="/api/author/chapters"&&m==="POST")'), 'Backend supports creating chapter drafts');
assert.ok(source.includes("const kind=String(b.kind??n.kind??'original').trim().toLowerCase();if(!CONTENT_FORMAT_IDS.has(kind))"), 'Backend validates format IDs when editing stories');

assert.ok(source.includes('Rights evidence is required before submitting this work for review.'), 'Backend independently enforces rights evidence');

const manifest = JSON.parse(fs.readFileSync('public/manifest-17.17.0.webmanifest','utf8'));
assert.equal(manifest.version,'17.17.0','PWA manifest version matches release');
console.log('Content format checks passed: '+formats.length+' formats, comic viewer modes, versioned assets verified.');
