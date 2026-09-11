// win1200: pressbooks章节视觉确认 + tab清场(保最后一个)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://pressbooks.pub/leoxmnotes/chapter/how-long-does-a-smog-check-take-the-real-time-budget/'), { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
await sleep(10000);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/backlink_skills/storage/_w1200_pb_public_final.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT-OK');
// 清掉其它多余tab只留本tab
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
for (const x of list.filter(y => y.type === 'page' && y.id !== t.id && !/about:blank/.test(y.url || ''))) {
  await fetch('http://127.0.0.1:9224/json/close/' + x.id).catch(() => {});
}
const rest = (await (await fetch('http://127.0.0.1:9224/json/list')).json()).filter(y => y.type === 'page');
console.log('TABS-LEFT:', rest.length, rest.map(y => (y.url || '').slice(0, 50)));
process.exit(0);
