import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('virily'));
if (!tab) { const nt = await (await fetch('http://127.0.0.1:9224/json/new?https://www.virily.com/wp-admin/', { method: 'PUT' })).json(); tab = nt; log('NEW TAB'); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 6000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
await sleep(6000);
const cur = await c.evalT('location.href', 6000);
log('URL: ' + cur);
const txt = await c.evalT('document.body ? document.body.innerText.slice(0, 400) : "NOBODY"', 8000);
log('TXT: ' + String(txt).split('\n').slice(0, 12).join(' | '));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_vi_wpadmin.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
ws.close(); process.exit(0);
