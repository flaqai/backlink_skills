import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it captcha v2: full-page burst frames (challenge visible at right side of viewport)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
for (let i = 1; i <= 3; i++) {
  const shot = await c.send('Page.captureScreenshot', {format:'png'});
  writeFileSync(`D:/Github/seoadminC/storage/_reg0000/scg${i}.png`, Buffer.from(shot.data,'base64'));
  await sleep(1300);
}
console.log('saved');
process.exit(0);
