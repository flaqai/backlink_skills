import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.send('Page.navigate', {url:'https://youslade.com/leoxm26y'});
await sleep(9000);
const st = await c.evalT(`(function(){ const b=(document.body.innerText||''); const cnt=(b.match(/running notebook/g)||[]).length; return JSON.stringify({cnt, sample: b.slice(0,150)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_profile.png', Buffer.from(shot.data,'base64'));
process.exit(0);
