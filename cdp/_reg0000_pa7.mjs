import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
await sleep(15000);
const st = await c.eval(`(function(){ const es = performance.getEntriesByType('resource').filter(e=>/api|register|user|account|create/i.test(e.name)).slice(-12).map(e=>({u:e.name.slice(0,110), d:e.duration|0, s:e.responseStatus})); return JSON.stringify({url: location.href.slice(0,110), btnSpin: !!document.querySelector('.fa-spinner,.loading,[class*=spin]'), res: es}); })()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_submit2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
