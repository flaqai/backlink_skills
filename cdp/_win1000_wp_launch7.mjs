// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/start/launch-site/plans-launch?siteSlug=leoxmseo2.wordpress.com&redirect_to=https%3A%2F%2Fleoxmseo2.wordpress.com%2Fwp-admin%2Findex.php'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'GET' }).catch(e => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await c.send('Page.enable');
await c.send('Page.bringToFront', {}).catch(() => {});
await sleep(13000);
// focus + 真实Enter键
const fr = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim().toLowerCase() === 'start with a free plan'); if (!b) return 'miss'; b.focus(); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), focused: document.activeElement === b }); })()`);
log('focus:', fr);
if (fr.startsWith('{')) {
  const b = JSON.parse(fr);
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await sleep(15000);
  // 若又出现真实鼠标点击一遍
  const st = await c.eval(`location.href.slice(0, 110)`);
  log('Enter后URL:', st);
  const again = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim().toLowerCase() === 'start with a free plan'); if (!b) return 'gone'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
  if (again.startsWith('{')) {
    const b2 = JSON.parse(again);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b2.x, y: b2.y });
    await sleep(400);
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
    await sleep(15000);
  }
  log('终URL:', await c.eval(`location.href.slice(0, 110)`));
}
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| smogcheck锚:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
