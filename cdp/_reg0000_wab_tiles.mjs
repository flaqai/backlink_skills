import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tiles = JSON.parse(process.argv[2] || '[]');
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t2 => t2.type === 'page' && /writeablog/.test(t2.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
for (const [x, y] of tiles) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
}
console.log('TILES_CLICKED', tiles.length);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_wab_tiled.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
