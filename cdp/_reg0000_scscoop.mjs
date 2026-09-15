import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: bookmarklet-style scoop editor for a URL
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(400); }
const url = process.argv[2] || 'https://en.wikipedia.org/wiki/Content_curation';
tab = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://www.scoop.it/bookmarklet?url=' + encodeURIComponent(url)), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(10000);
const st = await c.evalT(`(function(){ const ta=[...document.querySelectorAll('textarea,[contenteditable=true]')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,id:x.id||'',name:x.name||'',ph:(x.placeholder||'').slice(0,40)})); const btns=[...document.querySelectorAll('button,input[type=submit],a.btn')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,txt:(x.innerText||x.value||'').trim().slice(0,30)})).filter(x=>x.txt); return JSON.stringify({url:location.href.slice(0,100), ta:ta.slice(0,5), btns:btns.slice(0,8)}); })()`, 12000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_scoop.png', Buffer.from(shot.data,'base64'));
console.log('TABID='+tab.id);
process.exit(0);
