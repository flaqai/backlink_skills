import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://pressbooks.pub/leoxmnotes/wp-admin/edit.php?post_type=chapter' });
await sleep(10000);
const r = await cdp.eval(`(() => {
  const rows = [...document.querySelectorAll('table.posts tr td a.row-title')].map(a => ({t: a.innerText.trim().slice(0,60), h: a.href})).slice(0,6);
  return JSON.stringify({rows, head: document.body.innerText.slice(0,150)});
})()`);
console.log('CHAPTERS:', r.slice(0, 600));
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/backlink_skills/storage/_w1200_pb_list.png', Buffer.from(shot.data, 'base64'));
