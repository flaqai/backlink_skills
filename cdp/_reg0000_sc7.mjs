import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const st = await c.evalT(`(function(){ const f=[...document.querySelectorAll('iframe')].map(x=>({s:(x.src||'').slice(0,50),x:Math.round(x.getBoundingClientRect().x),y:Math.round(x.getBoundingClientRect().y),w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})).filter(f=>f.w>100&&f.h>100); return JSON.stringify({url:location.href.slice(0,90), capFrames:f, body:(document.body.innerText||'').split('\\n').filter(x=>x.trim()).slice(0,10).join('|').slice(0,200)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_now.png', Buffer.from(shot.data,'base64'));
process.exit(0);
