import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
const sleepMs = (ms) => new Promise(r => setTimeout(r, ms));
const click = async (x, y, wait = 2000) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleepMs(wait);
};
await click(484, 530, 3000); // 点发布框展开
const js = "(() => { const out=[]; for (const e of document.querySelectorAll('textarea,input[type=text],button')) { const r=e.getBoundingClientRect(); if(r.width>0) out.push(e.tagName+' id='+(e.id||'')+' name='+(e.name||'')+' txt='+(e.innerText||e.placeholder||'').slice(0,22)+'@'+Math.round(r.x)+','+Math.round(r.y)); } return out.slice(0,16).join(' || ')||'EMPTY'; })()";
log(await c.evalT(js, 9000));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_ys_expand.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
ws.close(); process.exit(0);
