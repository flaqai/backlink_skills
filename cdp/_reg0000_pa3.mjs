import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// postach: burst-capture captcha animation frames to find highest jumper
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
for (let i = 1; i <= 4; i++) {
  const shot = await c.send('Page.captureScreenshot', {format:'png', clip:{x:423,y:119,width:520,height:570,scale:1}});
  writeFileSync(`D:/Github/seoadminC/storage/_reg0000/pa_f${i}.png`, Buffer.from(shot.data,'base64'));
  await sleep(1400);
}
console.log('4 frames saved');
process.exit(0);
