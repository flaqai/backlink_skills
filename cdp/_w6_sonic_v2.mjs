// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const res = await fetch('https://www.sonicrun.com/cgi-bin/v.cgi', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.sonicrun.com/cgi-bin/v.cgi?e=sr.zak@92ng.com&c=n7R6f3' }, body: 'terms=YES' });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /accepted/i, /listed/i, /added/i, /success/i, /review/i, /error/i, /invalid/i, /will be/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{110}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('HEAD:', text.slice(0, 450));
