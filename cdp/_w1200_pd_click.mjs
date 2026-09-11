// win1200: pd挑战点格 (坐标列表参数) + 重截图
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => (t.url || '').includes('poordirectory') && t.type === 'page');
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const c = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise(r => c.ws.addEventListener('open', r));
await c.send('Page.enable');
const pts = process.argv[3].split(';').map(s => s.split(',').map(Number));
for (const [x, y] of pts) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  console.log('clicked', x, y);
  await sleep(1200);
}
const sh = await c.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/seoadminC/storage/_w12_pd_ch2.png', Buffer.from(sh.data, 'base64'));
console.log('SCREENSHOT2 saved');
