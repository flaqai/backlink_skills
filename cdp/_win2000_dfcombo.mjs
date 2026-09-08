// dofollow.tools combobox 循环重开 (win2000): hydration竞态打法
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('dofollow.tools/submit'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
async function comboState(match) { return c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); return b ? b.dataset.state : 'NO'; })()`); }
async function openComboLoop(match, label) {
  for (let i = 0; i < 6; i++) {
    const st = await comboState(match);
    if (st === 'open') return true;
    if (st === 'NO') { await sleep(2000); continue; }
    const bp = await c.eval(`(() => { const b = [...document.querySelectorAll('button[role=combobox]')].find(x => ${match}.test(x.innerText) && x.offsetWidth > 0); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    if (bp === 'NO') { await sleep(1500); continue; }
    const b = JSON.parse(bp);
    await click(b.x, b.y);
    await sleep(2200);
    const after = await comboState(match);
    if (after === 'open') return true;
  }
  console.log(label, 'FAILED to open');
  return false;
}
async function pickOption(txt) {
  for (let i = 0; i < 3; i++) {
    const op = await c.eval(`(() => { const hit = [...document.querySelectorAll('[role=option]')].find(x => x.offsetWidth > 0 && x.getAttribute('data-value') === ${JSON.stringify(txt)}); if (!hit) return 'MISS'; hit.scrollIntoView({ block: 'center' }); const r = hit.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    if (op === 'MISS') { await sleep(1200); continue; }
    const p = JSON.parse(op);
    await click(p.x, p.y);
    await sleep(1000);
    return true;
  }
  return false;
}
const esc = async () => { await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(1200); };

console.log('CAT open:', await openComboLoop('/categories/i', 'CAT'));
for (const cat of ['Productivity', 'Developer Tools', 'Automation']) console.log(' pick', cat, await pickOption(cat));
await esc();
console.log('PRICE open:', await openComboLoop('/pricing/i', 'PRICE'));
console.log(' pick Free', await pickOption('Free'));
await esc();
console.log('PLAT open:', await openComboLoop('/platform/i', 'PLAT'));
console.log(' pick Web', await pickOption('Web'));
await esc();
// 验证选择状态
console.log('验证:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => (b.innerText||'').trim().slice(0,40))))()`));
// Next
const np = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim().startsWith('Next') && !x.disabled); if (!b) return 'NO'; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
console.log('Next:', np);
if (np !== 'NO') {
  const n = JSON.parse(np);
  await click(n.x, n.y);
  await sleep(6000);
  console.log('step:', await c.eval(`(() => { const tx = document.body.innerText; return JSON.stringify({ s2: tx.includes('Submission Type') && !tx.includes('Basic Information'), errs: [...document.querySelectorAll('[class*=error],[role=alert]')].filter(e => e.offsetWidth > 0 && (e.innerText || '').trim()).map(e => e.innerText.trim().slice(0, 60)).slice(0, 4) }); })()`));
}
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_df2.jpg', Buffer.from(shot.data, 'base64'));
