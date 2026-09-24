// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
const i = r.indexOf('setload").value');
console.log('CTX-1:', r.slice(Math.max(0,i-700), i+100).replace(/\s+/g,' '));
// 所以外链js
for (const f of [...r.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)]) console.log('EXTJS:', f[1]);
