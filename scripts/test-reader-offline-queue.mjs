import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const worker=fs.readFileSync('src/index.js','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');

assert.equal(app,served,'Editable and served app bundles must remain byte-identical.');
assert.ok(app.includes("async function chapters(){"),'Chapter archive must own the download queue.');
assert.ok(app.includes('id="downloadOfflineQueue"'),'Queue must require an explicit user action.');
assert.ok(app.includes('let queueRunning=false,queueCancelled=false'),'Queue must track running and cancellation state.');
assert.ok(app.includes("if(queueRunning){queueCancelled=true"),'Readers must be able to cancel an active queue.');
assert.ok(app.includes('const eligible=n.chapters.filter(ch=>Number(ch.unlocked)===1&&Number(ch.offline_allowed)===1'),'Only currently unlocked, offline-approved chapters may enter the queue.');
assert.ok(app.includes('const queue=eligible.slice(0,slots)'),'Queue length must respect remaining chapter capacity.');
assert.ok(app.includes("confirm('Save '+queue.length+' eligible chapter"),'Bulk downloads must require explicit confirmation.');
assert.ok(app.includes("api('/api/chapters/'+Number(item.id)+'?purpose=offline')"),'Each chapter must be rechecked by the chapter API before saving.');
assert.ok(app.includes('detail.unlocked!==true||detail.offline_allowed!==true'),'The queue must reject any chapter whose current API authorization differs.');
assert.ok(app.includes('offlineStore.save({novel:'),'Queue must use the shared bounded offline store.');
assert.ok(app.includes('queueProgress.value=processed'),'Queue must report actual processed progress.');
assert.ok(app.includes('The 20 MB storage limit was reached.'),'Queue must stop cleanly at the aggregate storage limit.');
assert.ok(app.includes('The 25-chapter limit was reached.'),'Queue must stop cleanly at the chapter-count limit.');
assert.ok(worker.includes('AS unlocked,CASE WHEN n.rights_status IN (\'original\',\'public_domain\') THEN 1 ELSE 0 END AS offline_allowed'),'Chapter archive must expose account-specific unlock and rights eligibility.');
assert.ok(worker.includes('if(new URL(req.url).searchParams.get("purpose")!=="offline")await env.DB.prepare("INSERT INTO chapter_views'),'Offline queue checks must not inflate chapter view counts.');
assert.ok(css.includes('.offlineQueuePanel progress{width:100%'),'Queue progress must be visible and responsive.');
console.log('Rights-checked offline queue, cancellation, storage caps and view-count neutrality checks passed.');
