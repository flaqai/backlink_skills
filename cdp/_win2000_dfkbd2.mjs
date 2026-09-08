// dofollow combobox 键盘全流程: Space开→ArrowDown遍历→Enter选
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
const enter = () => key('Enter', 'Enter', 13);
const arrowDown = () => key('ArrowDown', 'ArrowDown', 40);
const highlighted = () => c.eval(`(() => { const h = document.querySelector('[role=option][data-highlighted]'); return h ? h.getAttribute('data-value') || h.innerText.trim() : 'NONE'; })()`);

async function openCombo(match) {
  const ok = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); b.focus(); return document.activeElement === b ? 'OK' : 'NOFOCUS'; })()`);
  if (ok !== 'OK') return false;
  await space();
  await sleep(1800);
  const st = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`);
  return st === 'open';
}
async function pickByKey(target) {
  for (let i = 0; i < 25; i++) {
    const cur = await highlighted();
    if (cur === target) { await enter(); await sleep(800); return true; }
    await arrowDown();
    await sleep(250);
  }
  return false;
}
async function pickByClickFirst() {
  // 有时第一项就是高亮, 直接Enter也行; 这里读第一可见项点击
  const op = await c.eval(`(() => { const h = [...document.querySelectorAll('[role=option]')].find(x => x.offsetWidth > 0); if (!h) return 'NO'; const r = h.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), v: h.getAttribute('data-value') }); })()`);
  if (op === 'NO') return false;
  const p = JSON.parse(op);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(800);
  return true;
}

// CAT
console.log('CAT open:', await openCombo('/categories/i'));
for (const cat of ['Productivity', 'Developer Tools', 'Automation']) {
  const r = await pickByKey(cat);
  console.log(' pick', cat, r);
  if (r) await openCombo('/categories/i'); // 重开选下一个
}
await key('Escape', 'Escape', 27); await sleep(1000);
// PRICE
console.log('PRICE open:', await openCombo('/pricing/i'));
console.log(' pick Free', await pickByKey('Free'));
if (!(await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => /pricing/i.test(x.innerText)); return b ? b.dataset.state : 'NO'; })()`)) ) {}
await key('Escape', 'Escape', 27); await sleep(1000);
// PLATFORM
console.log('PLAT open:', await openCombo('/platform/i'));
console.log(' pick Web', await pickByKey('Web'));
await key('Escape', 'Escape', 27); await sleep(1000);
console.log('终验证:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => (b.innerText||'').trim().slice(0,50))))()`));
