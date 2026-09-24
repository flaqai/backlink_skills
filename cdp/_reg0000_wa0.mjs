import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('writeablog.net'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const st = await c.evalT(`(function(){ const inputs=[...document.querySelectorAll('input,button')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,type:x.type||'',id:x.id||'',name:x.name||'',ph:x.placeholder||'',txt:(x.innerText||x.value||'').slice(0,25)})); return JSON.stringify({url:location.href.slice(0,90), title:document.title.slice(0,60), inputs:inputs.slice(0,15)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/wa_probe.png', Buffer.from(shot.data,'base64'));
process.exit(0);
