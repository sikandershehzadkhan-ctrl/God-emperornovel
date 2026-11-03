import fs from 'node:fs';
const app=fs.readFileSync('public/app.js','utf8');
const checks={
 'reading progress is measured against the chapter article rather than total document height': app.includes("const article=$('.readerArticle')") && app.includes('rect.height'),
 'progress sampling is throttled with requestAnimationFrame': app.includes('progressFrame=requestAnimationFrame('),
 'progress writes tolerate unavailable local storage': app.includes("localStorage.setItem('readerProgress:'+id,String(pct))") && app.includes('catch(e){}'),
 'progress is saved when the reader page is hidden': app.includes("window.addEventListener('pagehide'"),
 'restore waits for images and fonts to settle': app.includes("Promise.all([ready,document.fonts?.ready||Promise.resolve()])"),
 'restore uses the chapter-relative reading position': app.includes('top+(bottom-top)*chapterPct/100-window.innerHeight*.35'),
};
for(const [label,ok] of Object.entries(checks)) console.log((ok?'PASS: ':'FAIL: ')+label);
if(Object.values(checks).some(ok=>!ok))process.exit(1);
