import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('dofollow.tools/submit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const key = async (k, code, vk) => {
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
const space = () => key(' ', 'Space', 32);
async function openByText(txt) {
  const st = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => x.innerText.includes(${JSON.stringify(txt)})); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); b.focus(); return b.dataset.state; })()`);
  if (st === 'NO') return false;
  if (st !== 'open') { await space(); await sleep(1500); }
  return true;
}
async function clickFirstOption() {
  const op = await c.eval(`(() => { const h = [...document.querySelectorAll('[role=option]')].find(x => x.offsetWidth > 0 && x.getBoundingClientRect().y >= 0 && x.getBoundingClientRect().y < 900); if (!h) return 'NO'; const r = h.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + Math.min(100, r.width/2)), y: Math.round(r.y + r.height/2), v: (h.getAttribute('data-value') || h.innerText.trim()).slice(0,30) }); })()`);
  if (op === 'NO') return 'NO-OPTION-VISIBLE';
  const p = JSON.parse(op);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(800);
  return p.v;
}
for (let i = 0; i < 3; i++) {
  if (!(await openByText('categories'))) break;
  console.log('CAT#' + i, '点击:', await clickFirstOption());
  await sleep(500);
}
if (await openByText('platforms')) console.log('PLAT 点击:', await clickFirstOption());
console.log('终验证:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => (b.innerText||'').trim().slice(0,50))))()`));
