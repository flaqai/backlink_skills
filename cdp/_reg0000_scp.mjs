import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: open topic page, find publish/scoop composer
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(400); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.scoop.it/topic/leo-s-software-notebook', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const st = await c.evalT(`(function(){ const inputs=[...document.querySelectorAll('input,textarea,button,[contenteditable]')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,x:1&&x.tagName==='INPUT'?x.type:'',id:x.id||'',name:x.name||'',ph:(x.placeholder||'').slice(0,40),ce:x.isContentEditable||false,txt:(x.innerText||x.value||'').slice(0,25)})); return JSON.stringify({url:location.href.slice(0,90), inputs:inputs.slice(0,14)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_tpage.png', Buffer.from(shot.data,'base64'));
process.exit(0);
