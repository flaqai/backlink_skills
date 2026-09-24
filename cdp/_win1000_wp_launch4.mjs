// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/start/launch-site/plans-launch?siteSlug=leoxmseo2.wordpress.com&redirect_to=https%3A%2F%2Fleoxmseo2.wordpress.com%2Fwp-admin%2Findex.php'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const clickText = async (exact) => {
  const r = await c.eval(`(() => {
    for (const x of document.querySelectorAll('button,a')) {
      const tt = (x.textContent || '').trim().toLowerCase();
      if (tt === ${JSON.stringify(exact)} && !x.disabled) {
        x.scrollIntoView({ block: 'center' });
        const r = x.getBoundingClientRect();
        return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
      }
    }
    return 'miss';
  })()`);
  log('点[' + exact + ']:', r);
  if (!r.startsWith('{')) return false;
  const b = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  return true;
};
await sleep(12000);
if (await clickText('start with a free plan')) {
  await sleep(5000);
  const scan = await c.eval(`JSON.stringify({ url: location.href.slice(0, 110), btns: [...document.querySelectorAll('button,a')].map(x => (x.textContent || '').trim()).filter(Boolean).slice(0, 18) })`);
  log('free后:', String(scan).slice(0, 600));
  for (const cand of ['launch site', 'launch your site', 'continue']) { if (await clickText(cand)) break; }
}
await sleep(5000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上ComingSoon:', live.toLowerCase().includes('coming soon') ? 'YES' : 'NO', '| smogcheck锚:', (live.match(/smogcheck-nearme\.com/g) || []).length, '处 | 正文段落在:', live.includes('Bureau of Automotive Repair') ? 'Y' : 'N');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
