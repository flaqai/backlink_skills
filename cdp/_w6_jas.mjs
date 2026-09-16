// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { headers: H, redirect: 'follow' });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length, 'final', r.url.slice(0,70));
const forms = [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]);
console.log('FORMS:', forms.join(' || ').slice(0,300));
for (const m of h.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
  const s = m[0].replace(/\s+/g,' ');
  if (/type=["']?hidden/i.test(s) && !/csrf|token/i.test(s)) continue;
  console.log(' ', s.slice(0,170));
}
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log('TEXT:', text.slice(0,400));
