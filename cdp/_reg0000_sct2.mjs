import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await sleep(6000);
const st = await c.evalT(`(function(){ const inputs=[...document.querySelectorAll('input,textarea,button')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,type:x.type||'',id:x.id||'',name:x.name||'',ph:(x.placeholder||'').slice(0,30),txt:(x.innerText||x.value||'').slice(0,25)})); return JSON.stringify({url:location.href.slice(0,90), n:inputs.length, inputs:inputs.slice(0,12)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_create.png', Buffer.from(shot.data,'base64'));
process.exit(0);
