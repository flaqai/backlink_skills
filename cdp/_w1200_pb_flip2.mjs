import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('post.php?post=23'));
if (!tab) { console.log('NO-TAB'); process.exit(1); }
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
const r = await cdp.eval(`(() => {
  const opts = [...document.querySelectorAll('#post_status option, select[name=post_status] option')].map(o => ({v: o.value, t: o.textContent, sel: o.selected}));
  const btns = [...document.querySelectorAll('input[type=submit], button')].filter(b => b.offsetParent).map(b => ({id: b.id||'', v: (b.value||b.innerText||'').slice(0,25)})).slice(0,10);
  return JSON.stringify({opts, btns});
})()`);
console.log('CTRL:', r.slice(0, 600));
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/backlink_skills/storage/_w1200_pb_edit23.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT-OK');
