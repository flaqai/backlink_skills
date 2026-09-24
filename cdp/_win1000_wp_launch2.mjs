// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/start/launch-site/domains-launch?siteSlug=leoxmseo2.wordpress.com&redirect_to=https%3A%2F%2Fleoxmseo2.wordpress.com%2Fwp-admin%2Findex.php'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(12000);
const step1 = await c.eval(`(() => {
  const btns = [...document.querySelectorAll('button,a')].map(x => (x.textContent || '').trim()).filter(Boolean);
  return JSON.stringify({ url: location.href.slice(0, 110), btns: btns.slice(0, 25) });
})()`);
log('向导步1:', String(step1).slice(0, 800));
// 找 free/skip/continue 类按钮
const pick = await c.eval(`(() => {
  const re = ['skip', 'free', 'continue', 'not sure yet', 'decide later', 'keep'];
  for (const x of document.querySelectorAll('button,a')) {
    const tt = (x.textContent || '').trim().toLowerCase();
    if (!tt) continue;
    for (const k of re) { if (tt.indexOf(k) >= 0) { x.scrollIntoView({ block: 'center' }); const r = x.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: tt.slice(0, 40) }); } }
  }
  return 'no-pick';
})()`);
log('选择:', pick);
if (pick.startsWith('{')) {
  const b = JSON.parse(pick);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(8000);
}
const step2 = await c.eval(`(() => {
  const btns = [...document.querySelectorAll('button,a')].map(x => (x.textContent || '').trim()).filter(Boolean);
  let launch = null;
  for (const x of document.querySelectorAll('button,a')) { if (/launch/i.test(x.textContent || '') && !x.disabled) { x.scrollIntoView({ block: 'center' }); const r = x.getBoundingClientRect(); launch = JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: x.textContent.trim().slice(0, 40) }); break; } }
  return JSON.stringify({ url: location.href.slice(0, 110), launch, btns: btns.slice(0, 25) });
})()`);
log('向导步2:', String(step2).slice(0, 800));
const s2 = JSON.parse(step2);
if (s2.launch) {
  const b2 = JSON.parse(s2.launch);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b2.x, y: b2.y, button: 'left', clickCount: 1 });
  await sleep(12000);
  const fin = await c.eval(`JSON.stringify({ url: location.href.slice(0, 100), txt: document.body.innerText.split(String.fromCharCode(10)).join(' | ').slice(0, 200) })`);
  log('终态:', String(fin).slice(0, 400));
}
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| smogcheck锚:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
