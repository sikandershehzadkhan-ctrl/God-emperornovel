import assert from "node:assert/strict";
import { assessPublicationQuality } from "../src/content-quality-policy.mjs";

const formats=["original","fanfiction","light_novel","web_novel","manga","manhwa","manhua","webtoon","comic","graphic_novel","anime","cartoon","audiobook","drama","game"];
const base={title:"The Imperial Archive",author:"Sikander",description:"A richly detailed story about a young strategist navigating a fractured empire, difficult alliances and the cost of rebuilding a civilization.",language:"English",kind:"original",rights_status:"original",rights_evidence:"",cover_url:"https://example.test/cover.webp"};
const chapter={title:"Chapter One",content:"<p>The city woke beneath a pale sky. The council gathered before sunrise, and every faction arrived with a different account of the border crisis.</p>",publication_status:"published"};

const ready=assessPublicationQuality(base,[chapter],formats);
assert.equal(ready.ready,true);
assert.deepEqual(ready.issues,[]);
assert.ok(ready.warnings.some(x=>x.code==="short_chapter"));

assert.equal(assessPublicationQuality(base,[],formats).issues[0].code,"published_chapter_required");
assert.ok(assessPublicationQuality({...base,description:"Too short."},[chapter],formats).issues.some(x=>x.code==="description_too_short"));
assert.ok(assessPublicationQuality({...base,rights_status:"licensed"},[chapter],formats).issues.some(x=>x.code==="rights_evidence_missing"));
assert.ok(assessPublicationQuality({...base,rights_status:"pending"},[chapter],formats).issues.some(x=>x.code==="rights_ineligible"));
assert.ok(assessPublicationQuality({...base,kind:"unknown"},[chapter],formats).issues.some(x=>x.code==="format_invalid"));
assert.ok(assessPublicationQuality(base,[{...chapter,content:"<script>bad()</script>"}],formats).issues.some(x=>x.code==="chapter_content_missing"));
assert.equal(assessPublicationQuality({...base,cover_url:""},[chapter],formats).ready,true);
assert.ok(assessPublicationQuality({...base,cover_url:""},[chapter],formats).warnings.some(x=>x.code==="cover_missing"));
assert.ok(assessPublicationQuality({...base,rights_status:"licensed",rights_evidence:"Contract reference #123"},[chapter],formats).ready);
console.log("Publication quality policy tests passed: required metadata, rights evidence, chapter readiness and non-blocking editorial warnings.");
