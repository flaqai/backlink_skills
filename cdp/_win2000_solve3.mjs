// 4x4挑战 rect锚点solve: node _win2000_solve4.mjs <domain> "r2c2;r2c3;..."
import { CDP, sleep } from './CDP.mjs';
const [domain, cellsArg] = process.argv.slice(2);
const cells = (cellsArg || '').split(';').filter(Boolean).map(s => ({ row: +s.match(/r(\d)c(\d)/i)[1], col: +s.match(/r(\d)c(\d)/i)[2] }));
const GX = 7, GY = 126, CW = 127, CH = 127;
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(domain) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
async function rect() {
  const s = await cdp.evalT(`(() => { const bf = document.querySelector('iframe[src*="api2/bframe"], iframe[src*="reloads/bframe"]'); if (!bf) return null; const r = bf.getBoundingClientRect(); return JSON.stringify({x: r.x, y: r.y, w: r.width, h: r.height}); })()`, 8000);
  return s ? JSON.parse(s) : null;
}
async function inView() {
  let r = await rect();
  if (!r) { console.log('NOBFRAME'); return null; }
  if (r.y < 0 || r.y + r.h > 900) {
    await cdp.eval(`document.querySelector('iframe[src*="api2/bframe"], iframe[src*="reloads/bframe"]').scrollIntoView({block:'center'})`);
    await sleep(900);
    r = await rect();
    console.log('REALIGN:', JSON.stringify(r));
  }
  return r;
}
let r = await inView();
if (!r) process.exit(1);
for (const c of cells) {
  const x = Math.round(r.x + GX + CW * (c.col - 1) + CW / 2);
  const y = Math.round(r.y + GY + CH * (c.row - 1) + CH / 2);
  console.log('CELL r' + c.row + 'c' + c.col, '->', x, y);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  await sleep(700);
}
// VERIFY 按钮固定在挑战框右下
const vx = Math.round(r.x + r.w - 60), vy = Math.round(r.y + r.h - 32);
console.log('VERIFY at', vx, vy);
for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: vx, y: vy, button: 'left', clickCount: 1 });
let token = 0;
for (let i = 0; i < 10; i++) {
  await sleep(1400);
  token = await cdp.evalT(`(document.querySelector('#g-recaptcha-response') || {}).value ? document.querySelector('#g-recaptcha-response').value.length : 0`, 6000).catch(() => 0);
  console.log('TOKEN', i, token);
  if (token > 100) break;
}
if (token > 100) {
  console.log('NEWSTATE bframe:', JSON.stringify(await rect()));
  await cdp.eval(`(() => { const b = document.querySelector('#submitForm input[name="submit"][value="Continue"]') || document.querySelector('form input[type=submit][value=Continue]'); if (b) { b.scrollIntoView({block:'center'}); b.click(); return 'CLICKED'; } return 'NOBTN'; })()`);
  await sleep(5000);
  const page = await cdp.evalT(`document.body.innerText.slice(0, 300)`, 8000);
  console.log('AFTER-SUBMIT:', String(page).replace(/\n/g, ' | ').slice(0, 250));
}
process.exit(0);
