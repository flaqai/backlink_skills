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
const getState = (match) => c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`);
const focusIt = (match) => c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); b.focus(); return 'OK'; })()`);
const space = () => key(' ', 'Space', 32);
const enter = () => key('Enter', 'Enter', 13);
const arrowDown = () => key('ArrowDown', 'ArrowDown', 40);

async function ensureOpen(match) {
  let st = await getState(match);
  if (st === 'open') return true;
  if (await focusIt(match) !== 'OK') return false;
  await space();
  await sleep(1600);
  return (await getState(match)) === 'open';
}
async function pickByKey(target) {
  const t = target.toLowerCase();
  for (let i = 0; i < 30; i++) {
    const cur = await c.eval(`(() => { const h = document.querySelector('[role=option][data-highlighted]'); return h ? (h.getAttribute('data-value') || h.innerText.trim()) : 'NONE'; })()`);
    if (cur && cur.toLowerCase() === t) { await enter(); await sleep(700); return true; }
    await arrowDown();
    await sleep(220);
  }
  return false;
}
// 列出PLAT选项(如果开着)
console.log('CAT state:', await getState('/categories/i'));
if (await ensureOpen('/categories/i')) {
  for (const cat of ['Productivity', 'Developer Tools', 'Automation']) {
    if ((await getState('/categories/i')) !== 'open') { if (!(await ensureOpen('/categories/i'))) break; }
    console.log(' pick', cat, await pickByKey(cat));
  }
  await key('Escape', 'Escape', 27); await sleep(900);
}
console.log('PLAT state:', await getState('/platform/i'));
if (await ensureOpen('/platform/i')) {
  const vals = await c.eval(`(() => JSON.stringify([...document.querySelectorAll('[role=option]')].filter(x => x.offsetWidth > 0).map(x => x.getAttribute('data-value')).slice(0,15)))()`);
  console.log('PLAT选项:', vals);
  console.log(' pick Web', await pickByKey('Web'));
  await key('Escape', 'Escape', 27); await sleep(900);
}
console.log('终验证:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => (b.innerText||'').trim().slice(0,45))))()`));
