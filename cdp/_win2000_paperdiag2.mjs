import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url === 'https://paper.wf/');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
console.log(await c.eval(`(() => JSON.stringify({
  buttons: [...document.querySelectorAll('button, [role=button], select, input[type=submit]')].filter(e => e.offsetWidth > 0).map(e => ({ t: (e.textContent||e.value||'').trim().slice(0,30), sel: (e.className||'').toString().slice(0,40) })).slice(0, 15),
  selects: [...document.querySelectorAll('select')].map(s => ({ name: s.name, opts: [...s.options].map(o => o.text).slice(0,6) }))
}, null, 1))()`));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('_win2000_paper2.jpg', Buffer.from(shot.data, 'base64'));
