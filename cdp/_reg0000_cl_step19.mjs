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
const click = async (x, y, wait = 2500) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleepMs(wait);
};
await click(757, 565, 5000); // FORUM43 块
const js = "(() => { const b=document.querySelector('.block-useit'); return b ? b.className + '@' + Math.round(b.getBoundingClientRect().x + b.getBoundingClientRect().width/2) + ',' + Math.round(b.getBoundingClientRect().y + b.getBoundingClientRect().height/2) : 'NOBTN'; })()";
const st = await c.evalT(js, 6000);
log('USEIT: ' + st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_forum43.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
ws.close(); process.exit(0);
