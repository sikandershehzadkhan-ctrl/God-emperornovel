import fs from 'node:fs';
import assert from 'node:assert/strict';
const css=fs.readFileSync('public/imperial-ui-primitives.css','utf8');
for(const path of ['terms','privacy','copyright']){
 const html=fs.readFileSync('public/'+path+'.html','utf8');
 for(const token of ['/imperial-design-tokens.css','/imperial-ui-primitives.css','in-legal-page','in-legal-main','in-legal-wrap','in-legal-hero','in-legal-content','in-legal-section'])assert.ok(html.includes(token),path+' page missing '+token);
 assert.ok(!html.includes('/style.css'),path+' still imports legacy stylesheet');
 assert.ok(!html.includes('class="legal'),'Retired legal classes remain in '+path);
 assert.ok(!html.includes('class="page"'),'Generic legacy page wrapper remains in '+path);
 assert.ok(!html.includes('class="wrap'),'Generic legacy wrap remains in '+path);
}
for(const token of ['.in-legal-page','.in-legal-hero','.in-legal-content','.in-legal-section','@media(max-width:42rem)','prefers-reduced-motion'])assert.ok(css.includes(token),'Legal design missing '+token);
console.log('Terms, Privacy and Rights & Copyright design contracts passed.');
