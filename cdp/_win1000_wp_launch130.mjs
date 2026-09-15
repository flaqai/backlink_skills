// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/wp-admin/index.php'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(12000);
const btn = await c.eval(`(() => {
  for (const b of document.querySelectorAll('a,button')) {
    if ((b.textContent || '').trim().toLowerCase() === 'launch site') {
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect();
      return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), tag: b.tagName });
    }
  }
  return 'no-launch-btn';
})()`);
log('Launch:', btn);
if (!btn.startsWith('{')) process.exit(2);
const b = JSON.parse(btn);
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
await sleep(8000);
// 确认面板: 找面板内的最终确认按钮
const confirm = await c.eval(`(() => {
  const cands = [...document.querySelectorAll('button')].filter(x => /launch/i.test(x.textContent || '') && !x.disabled);
  if (!cands.length) return 'no-confirm:' + location.href.slice(0, 90);
  const b = cands[cands.length - 1];
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: b.textContent.trim().slice(0, 40) });
})()`);
log('确认:', String(confirm).slice(0, 200));
if (confirm.startsWith('{')) {
  const b2 = JSON.parse(confirm);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
  await sleep(12000);
  const after = await c.eval(`JSON.stringify({ url: location.href.slice(0, 90), launchGone: ![...document.querySelectorAll('a,button')].some(x => (x.textContent || '').trim().toLowerCase() === 'launch site') })`);
  log('launch后:', after);
}
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| 锚链href:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处 | 标题在:', live.includes("Your Vehicle") ? 'Y' : 'N');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
