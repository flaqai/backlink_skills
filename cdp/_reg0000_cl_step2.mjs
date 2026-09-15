// reg0000 0909: creatorlink 第二步——真实点击发布开关→抓向导弹层+截图
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');

let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
if (!tab) { log('NO TAB'); throw new Error('NO TAB'); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');

// 确认开关还在原位
const probe = JSON.parse(await c.evalT(`(() => {
  const el = document.querySelector('#site-publish-onoff');
  if (!el) return JSON.stringify({ gone: true });
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), checked: el.checked });
})()`, 8000));
log('PROBE: ' + JSON.stringify(probe));
if (probe.gone) { log('SWITCH GONE'); throw new Error('switch gone'); }

// 真实鼠标点击
const x = probe.x, y = probe.y;
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
log('CLICKED ' + x + ',' + y);
await sleep(4000);

// 点击后状态：开关checked + publish-text + 弹层内容
const after = await c.evalT(`(() => {
  const sw = document.querySelector('#site-publish-onoff');
  const pt = document.querySelector('.publish-text');
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
  const layers = [...document.querySelectorAll('[class*=modal],[class*=wizard],[class*=layer],[class*=popup],[class*=guide],[class*=step]')].filter(vis).map(e => ({ cls: String(e.className).slice(0, 80), txt: (e.innerText || '').replace(/\\n+/g, ' | ').slice(0, 400) }));
  return JSON.stringify({ checked: sw ? sw.checked : null, ptext: pt ? pt.innerText : null, layers: layers.slice(0, 6) });
})()`, 10000);
log('AFTER: ' + after);

const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_afterclick.png', Buffer.from(shot.data, 'base64'));
log('SHOT saved');
log('DONE');
