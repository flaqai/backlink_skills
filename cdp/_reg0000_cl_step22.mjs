import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 6000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
const sleepMs = (ms) => new Promise(r => setTimeout(r, ms));
// 预览区内多次滚轮
for (let i = 0; i < 6; i++) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 680, y: 420, deltaX: 0, deltaY: 600 });
  await sleepMs(700);
}
const js = "(() => { const b=document.querySelector('.block-useit'); return b ? b.className : 'NOBTN'; })()";
log('AFTER SCROLL: ' + await c.evalT(js, 6000));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_text3.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
ws.close(); process.exit(0);
