import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const AUTHOR_STUDIO_LANG=(\{[\s\S]*?\});\s*function isSafeComicImageUrl/);
assert.ok(match, 'Author Studio locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Author Studio','Create original stories, fanfiction, serialized fiction, and illustrated-format projects.','Your world begins here.','Performance overview','Refresh insights','Story performance','Most-read chapters','Reader feedback','Refresh feedback','All feedback','Ratings','Comments','Chapter planning queue','Refresh queue','Story writing goals','Refresh goals','Creator notes','Refresh notes','Save private note','Editorial readiness','Refresh checks','Release calendar','Refresh calendar','Create a story','Story title','Story format','Synopsis','Language','Status','Rights status','Rights evidence (required for non-original works)','Rights notes','Create draft →','My stories','Drafts, chapter counts, and review status.','Refresh','Sign in to apply for creator access.','Sign in','Create account','Become an Imperial Creator','Apply for author access. Every application is reviewed before publishing tools are unlocked.','Turn your story into a published world.','Public author name','About you and your creative goals','Writing sample (250 to 6,000 characters)','Rights confirmation','Submit creator application','Return to Discover','Account settings'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14, 'Unexpected locale count');
assert.ok(app.includes('async function authorStudio()'), 'Author Studio handler missing');
assert.ok(app.includes('const applyAuthorStudioLanguage='), 'Dynamic author localization hook missing');
assert.ok(app.includes('new MutationObserver('), 'Dynamic author content observer missing');
assert.ok(app.includes('rights_status'), 'Rights status controls must remain present');
assert.ok(app.includes('rights_evidence'), 'Rights evidence controls must remain present');
assert.equal(app, served, 'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'), 'Public entry must load versioned asset');
console.log('Author Studio localization passed: 14 locales, 49 UI strings, dynamic content translation hook, rights fields, and source/served parity.');
