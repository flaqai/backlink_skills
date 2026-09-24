import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('edit.php?post_type=chapter'));
if (!tab) { console.log('NO-TAB'); process.exit(1); }
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
const r = await cdp.eval(`(() => {
  const rows = [...document.querySelectorAll('a.row-title')].map(a => ({t: a.innerText.trim().slice(0,55), h: a.href})).slice(0,6);
  return JSON.stringify(rows);
})()`);
console.log('ROWS:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/backlink_skills/storage/_w1200_pb_list.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT-OK');
process.exit(0);
