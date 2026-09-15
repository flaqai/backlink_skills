import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Page.enable');
// 先关掉 1/7 引导弹层（点다음或닫기）
const guide = JSON.parse(await c.evalT(`(() => {
  const els = [...document.querySelectorAll('button,a')].filter(e => ['다음','닫기','확인','X','x'].includes((e.innerText||'').trim()));
  if (!els.length) return JSON.stringify({none:true});
  const e = els.find(x => (x.innerText||'').trim()==='닫기') || els[0];
  const r = e.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), txt: e.innerText.trim()});
})()`, 8000));
log('GUIDE: ' + JSON.stringify(guide));
if (!guide.none) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: guide.x, y: guide.y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: guide.x, y: guide.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: guide.x, y: guide.y, button: 'left', clickCount: 1 });
  await sleep(1500);
}
// 点「메뉴/페이지 설정」
const menu = JSON.parse(await c.evalT(`(() => {
  const els = [...document.querySelectorAll('a,button,div,span,li')].filter(e => /메뉴.{0,3}페이지 설정/.test((e.innerText||'').trim()) && (e.innerText||'').trim().length < 30);
  if (!els.length) return JSON.stringify({none:true});
  const e = els[0];
  const r = e.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: e.tagName, cls: String(e.className).slice(0,50)});
})()`, 8000));
log('MENUBTN: ' + JSON.stringify(menu));
if (menu.none) { log('NO MENU BTN'); throw new Error('no menu btn'); }
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: menu.x, y: menu.y });
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: menu.x, y: menu.y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: menu.x, y: menu.y, button: 'left', clickCount: 1 });
await sleep(3000);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_menupanel.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
