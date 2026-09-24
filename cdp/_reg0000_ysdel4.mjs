import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: get duplicate post_id from DOM, delete via in-page fetch
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// find post ids containing our text
const ids = await c.evalT(`(function(){ const out=[]; document.querySelectorAll('[data-post-id], [id^=post], [id^=record]').forEach(x=>{ const id=x.getAttribute('data-post-id')||x.id; if(x.innerText&&x.innerText.includes('running notebook')) out.push(id); }); return JSON.stringify(out); })()`, 10000);
console.log('post ids:', ids);
if(ids === '[]' || ids === 'TIMEOUT'){ console.log('NO IDS'); process.exit(1); }
const arr = JSON.parse(ids);
if(arr.length < 2){ console.log('LESS THAN 2 POSTS, nothing to dedupe'); process.exit(0); }
// delete the newest duplicate (arr[0]) via in-page fetch
const pid = arr[0].replace(/^post_?/, '');
const r = await c.evalT(`(async function(){ const rs = await fetch('/requests.php?f=posts&s=delete&post_id=${pid}', {method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}}); const t = await rs.text(); return t.slice(0,200); })()`, 15000);
console.log('delete resp:', r);
await sleep(3000);
// verify remaining count
const chk = await c.evalT(`(function(){ const out=[]; document.querySelectorAll('[data-post-id], [id^=post], [id^=record]').forEach(x=>{ const id=x.getAttribute('data-post-id')||x.id; if(x.innerText&&x.innerText.includes('running notebook')) out.push(id); }); return JSON.stringify(out); })()`, 10000);
console.log('after:', chk);
process.exit(0);
