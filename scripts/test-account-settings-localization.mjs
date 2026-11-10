import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const match=app.match(/const SETTINGS_LANG=(\{[\s\S]*?\});\nconst RANKING_LANG=/);
assert.ok(match,'Settings locale dictionary must be isolated before the ranking dictionary');
const dictionaries=JSON.parse(match[1]);
const locales=['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys=['Settings','Make Imperial Novel yours. Preferences are saved on this device.','Appearance & Reading','Site theme','Reader theme','ACCESSIBILITY','Comfort & Control','Reduce motion','High contrast','DATA & PORTABILITY','Export preferences','Reset preferences','Clear local reading data','ACCOUNT & COMMUNITY','Your Imperial account','Account center','Interface language','Choose the language used across Imperial Novel.','Language preference saved.'];
assert.deepEqual(Object.keys(dictionaries).sort(),[...locales].sort(),'Settings must cover the complete supported 14-language interface');
for(const locale of locales){
 assert.ok(dictionaries[locale],'Missing locale: '+locale);
 for(const key of keys) assert.equal(typeof dictionaries[locale][key],'string','Missing '+locale+' translation: '+key);
 for(const key of keys) assert.ok(dictionaries[locale][key].trim(),'Empty '+locale+' translation: '+key);
}
assert.equal(Object.keys(dictionaries.en).length,keys.length,'English dictionary must define every settings label');
const start=app.indexOf('function settings()');
assert.ok(start>=0,'Canonical settings handler missing');
const end=app.indexOf('\nfunction ',start+15);
const handler=app.slice(start,end<0?undefined:end);
for(const token of ['id="setLanguage"',"localStorage.getItem('imperial_language')","$('#setLanguage').value=language","$('#setLanguage').addEventListener('change'",'setINLang(language)','currentAccountPreferences','settingsTouched','settingsSyncTimer','/api/account/preferences','exportPrefs','resetPrefs','clearLocalReading','imperial_reduced_motion','imperial_high_contrast','imperial_compact_cards']) assert.ok(handler.includes(token),'Canonical settings behavior missing: '+token);
for(const theme of ['light','dark','sepia','midnight','imperial','cosmic']) assert.ok(handler.includes('value="'+theme+'"'),'Missing site theme option: '+theme);
assert.ok(handler.includes('setSiteTheme')&&handler.includes('setReaderTheme'),'Site and reader theme controls must remain independent');
assert.equal(app,served,'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.23.0.js'),'Public entry must load the canonical versioned application asset');
console.log('Account settings localization passed: 14 locales, 19 translated strings, language restore/switch, six themes, accessibility controls, preference sync/export/reset and source/served parity.');
