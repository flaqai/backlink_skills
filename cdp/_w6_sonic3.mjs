// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const paths = ['/submission.htm', '/suggest.html', '/addurl.html', '/submit.html', '/site-submission.html', '/submission.html', '/add-site.html', '/addsite.html', '/free-listing.html', '/submit.php'];
for (const p of paths) {
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch('https://www.sonicrun.com' + p, { signal: ctl.signal, headers: H, redirect: 'follow' });
    clearTimeout(timer);
    const h = await r.text();
    const form = h.match(/<form[^>]*>/i)?.[0]?.slice(0,150) || '';
    const fields = [...h.matchAll(/<(?:input|select|textarea)\b[^>]*name=["']?([^"'>\s]+)/gi)].map(m => m[1]);
    if (r.status === 200 && (form || fields.length)) console.log(`${p} HTTP${r.status} len=${h.length} FORM:${form} FIELDS:${[...new Set(fields)].join(',')}`);
    else if (r.status !== 200) console.log(`${p} HTTP${r.status}`);
  } catch (e) { console.log(p, 'ERR', (e.cause?.code || e.message).slice(0,40)); }
}
