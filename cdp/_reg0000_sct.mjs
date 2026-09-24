import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: create first topic
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(400); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.scoop.it/theme/create', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const st = await c.evalT(`(function(){ const inputs=[...document.querySelectorAll('input,textarea,button')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,type:x.type||'',id:x.id||'',name:x.name||'',ph:(x.placeholder||'').slice(0,30),txt:(x.innerText||x.value||'').slice(0,25)})); return JSON.stringify({url:location.href.slice(0,80), inputs:inputs.slice(0,12)}); })()`, 10000);
console.log(st);
process.exit(0);
