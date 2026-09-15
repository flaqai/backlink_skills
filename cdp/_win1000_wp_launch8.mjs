// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/start/launch-site/plans-launch?siteSlug=leoxmseo2.wordpress.com&redirect_to=https%3A%2F%2Fleoxmseo2.wordpress.com%2Fwp-admin%2Findex.php'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await c.send('Page.enable');
await c.send('Page.bringToFront', {}).catch(() => {});
await sleep(13000);
// 监听响应看点击后发了什么请求
await c.eval(`window.__reqs = []; const of = window.fetch; window.fetch = function(...a) { window.__reqs.push(String(a[0]).slice(0, 120)); return of.apply(this, a); }; document.addEventListener('click', (e) => window.__reqs.push('CLICK:' + (e.target.textContent || '').trim().slice(0, 30)), true);`);
const r = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim().toLowerCase() === 'keep this plan' && !x.disabled); if (!b) return 'miss'; b.scrollIntoView({ block: 'center' }); const rc = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(rc.x + rc.width / 2), y: Math.round(rc.y + rc.height / 2) }); })()`);
log('KeepThisPlan按钮:', r);
if (r.startsWith('{')) {
  const b = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(15000);
  log('请求日志:', await c.eval(`JSON.stringify(window.__reqs.slice(0, 8))`));
  log('URL:', await c.eval(`location.href.slice(0, 110)`));
}
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| smogcheck锚:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
