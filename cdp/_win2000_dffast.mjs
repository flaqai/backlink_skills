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
async function openByText(txt) {
  const st = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => x.innerText.includes(${JSON.stringify(txt)})); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); b.focus(); return b.dataset.state; })()`);
  if (st === 'NO') return false;
  if (st !== 'open') { await space(); await sleep(1500); }
  const after = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => x.innerText.includes(${JSON.stringify(txt)})); return b ? b.dataset.state : 'NO'; })()`);
  return after === 'open';
}
async function enterHighlighted() {
  const cur = await c.eval(`(() => { const h = document.querySelector('[role=option][data-highlighted]'); return h ? (h.getAttribute('data-value') || h.innerText.trim()) : 'NONE'; })()`);
  await enter();
  await sleep(700);
  return cur;
}
// Categories ×3
for (let i = 0; i < 3; i++) {
  const opened = await openByText('categories');
  console.log('CAT#' + i, 'open:', opened);
  if (!opened) break;
  console.log(' 选:', await enterHighlighted());
  await sleep(600);
}
// Platforms ×1
if (await openByText('platforms')) console.log('PLAT 选:', await enterHighlighted());
console.log('终验证:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => (b.innerText||'').trim().slice(0,50))))()`));
// Next
const np = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('Next') && !x.disabled); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('Next:', np);
if (np !== 'NO') {
  const n = JSON.parse(np);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: n.x, y: n.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: n.x, y: n.y, button: 'left', clickCount: 1 });
  await sleep(6000);
  console.log('step:', await c.eval(`(() => { const tx = document.body.innerText; return JSON.stringify({ s2: tx.includes('Submission Type'), stillBasic: tx.includes('Basic Information'), errs: [...document.querySelectorAll('[class*=error],[role=alert]')].filter(e => e.offsetWidth > 0 && (e.innerText || '').trim()).map(e => e.innerText.trim().slice(0, 50)).slice(0, 4) }); })()`));
}
