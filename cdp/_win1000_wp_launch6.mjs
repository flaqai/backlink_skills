// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/start/launch-site/plans-launch?siteSlug=leoxmseo2.wordpress.com&redirect_to=https%3A%2F%2Fleoxmseo2.wordpress.com%2Fwp-admin%2Findex.php'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(13000);
const probe = await c.eval(`(() => {
  const out = [];
  for (const x of document.querySelectorAll('button,a')) {
    const tt = (x.textContent || '').trim().toLowerCase();
    if (tt === 'start with a free plan') out.push({ tag: x.tagName, href: x.getAttribute('href') || '', disabled: x.disabled === true });
  }
  return JSON.stringify(out);
})()`);
log('元素:', probe);
const els = JSON.parse(probe);
const a = els.find(e => e.tag === 'A' && e.href);
if (a) {
  log('导航到:', a.href.slice(0, 120));
  await c.eval(`location.href = ${JSON.stringify(a.href)}`);
  await sleep(15000);
} else {
  const btn = els.find(e => e.tag === 'BUTTON');
  if (btn) {
    await c.eval(`(() => { for (const x of document.querySelectorAll('button')) { if ((x.textContent || '').trim().toLowerCase() === 'start with a free plan') { x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); x.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); x.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return 'ev'; } } return 'miss'; })()`);
    await sleep(12000);
  }
}
const scan = await c.eval(`JSON.stringify({ url: location.href.slice(0, 120), txt: document.body.innerText.split(String.fromCharCode(10)).join(' | ').slice(0, 220) })`);
log('现在:', String(scan).slice(0, 500));
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| smogcheck锚:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
