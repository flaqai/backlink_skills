import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// jiliblog: check login state on /new-post (reg0400 halfway: editor lazy-loads ~25s)
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('jiliblog'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(400); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://jiliblog.com/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(12000);
const st = await c.evalT(`(function(){ const t=document.querySelector('#title'); const ta=document.querySelector('#content'); return JSON.stringify({url:location.href.slice(0,80), hasTitle:!!t, hasContent:!!ta, title:(t&&t.value||'').slice(0,30), body:(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean).slice(0,6).join('|').slice(0,180)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/jl_probe.png', Buffer.from(shot.data,'base64'));
console.log('TABID='+tab.id);
process.exit(0);
