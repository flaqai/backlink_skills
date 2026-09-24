// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('http://46-directories.directoriesadvertising.com/advertising-46-directories.php', { headers: H });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length);
const links = [...h.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']*directoriesadvertising[^"']*)["'][^>]*>([\s\S]{0,60}?)<\/a>/gi)].map(m => m[2].replace(/<[^>]+>/g,'').trim() + ' → ' + m[1]);
console.log([...new Set(links)].slice(0, 30).join('\n'));
if (!links.length) {
  const t = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  console.log('TEXT:', t.slice(0, 600));
}
