import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('dofollow.tools/submit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const key = async (type, o) => c.send('Input.dispatchKeyEvent', { type, ...o });
// 键盘开 combo: focus + Space
const r1 = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => /categories/i.test(x.innerText) && x.offsetWidth > 0); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); b.focus(); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), focused: document.activeElement === b }); })()`);
console.log('focus:', r1);
if (r1 !== 'NO') {
  const p = JSON.parse(r1);
  // Space 打开
  await key('keyDown', { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await key('keyUp', { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await sleep(2000);
  console.log('Space后 state:', await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => /categories/i.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`));
  // 若还关着, 真鼠标点击
  const st = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => /categories/i.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`);
  if (st !== 'open') {
    console.log('试 pointerdown at', p.x, p.y);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, buttons: 1 });
    await sleep(120);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0 });
    await sleep(2000);
    console.log('pointerdown后 state:', await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => /categories/i.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`));
  }
}
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 55 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_df3.jpg', Buffer.from(shot.data, 'base64'));
