import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogerus.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(12000);
const st = await c.evalT(`(function(){ const cf=document.body.innerText.includes('安全验证')||document.body.innerText.includes('Verify you are human')||document.body.innerText.includes('Checking'); const cb=[...document.querySelectorAll('iframe')].map(x=>({s:(x.src||'').slice(0,50),x:Math.round(x.getBoundingClientRect().x+30),y:Math.round(x.getBoundingClientRect().y+30)})).filter(f=>/challenges|turnstile/i.test(f.s)); return JSON.stringify({url:location.href.slice(0,70), cfStill:cf, turnstile:cb}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/bru_cf.png', Buffer.from(shot.data,'base64'));
process.exit(0);
