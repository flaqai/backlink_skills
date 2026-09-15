import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: open confirm link in browser
const url = process.argv[2];
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(500); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const st = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,100), title:document.title.slice(0,60), body:(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean).slice(0,10).join('|').slice(0,300)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_conf.png', Buffer.from(shot.data,'base64'));
console.log('TABID='+tab.id);
process.exit(0);
