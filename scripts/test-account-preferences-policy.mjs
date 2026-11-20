import assert from "node:assert/strict";
import { defaultAccountPreferences, validateAccountPreferences } from "../src/identity/account-preferences-policy.mjs";
const defaults=defaultAccountPreferences();
assert.deepEqual(defaults,{site_theme:"light",reader_theme:"dark",font_size:18,line_height:1.85,text_width:600,reduced_motion:false,high_contrast:false,compact_cards:false});
assert.equal(validateAccountPreferences({...defaults,reader_theme:"sepia",site_theme:"imperial",font_size:22,line_height:2,text_width:680,reduced_motion:true,high_contrast:true}).ok,true);
for(const theme of ["light","dark","midnight","sepia","imperial","cosmic"]) assert.equal(validateAccountPreferences({...defaults,site_theme:theme}).ok,true);
for(const value of [null,{...defaults,role:"admin"},{...defaults,site_theme:"neon"},{...defaults,reader_theme:"unknown"},{...defaults,font_size:31},{...defaults,font_size:18.5},{...defaults,line_height:1.7},{...defaults,text_width:900},{...defaults,reduced_motion:"true"}]) assert.equal(validateAccountPreferences(value).ok,false);
console.log("PASS: supported themes, reader typography bounds and boolean accessibility settings.");
