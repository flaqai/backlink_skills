import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await sleep(3000);
const shot = await c.send('Page.captureScreenshot', {format:'png', clip:{x:423,y:119,width:520,height:570,scale:1}});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_p2.png', Buffer.from(shot.data,'base64'));
console.log('ok');
process.exit(0);
