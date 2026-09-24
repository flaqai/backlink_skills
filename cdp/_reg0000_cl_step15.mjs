import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 6000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
const click = async (x, y, wait = 2500) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(wait);
};
await sleep(6000); // 等块预览渲染
const shot1 = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_preview.png', Buffer.from(shot1.data, 'base64'));
log('PREVIEW SHOT');
await click(1221, 61, 4000); // 사용 采用
const shot2 = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_used.png', Buffer.from(shot2.data, 'base64'));
log('USED SHOT');
ws.close(); process.exit(0);
