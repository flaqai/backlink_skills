// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { writeFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('https://thesaasdir.com/submit/', { headers: H });
const jar = (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
const h = await r.text();
console.log('HTTP', r.status, 'jar:', jar);
writeFileSync('D:/Github/seoadminC/storage/_w6_saas_submit.html', h);
const token = h.match(/name="csrfmiddlewaretoken" value="([^"]+)"/)?.[1];
console.log('csrf token:', token ? token.slice(0,20)+'...' : 'NOT FOUND');
// tier 选项
for (const m of h.matchAll(/<input[^>]*name=["']tier["'][^>]*>/gi)) console.log('TIER:', m[0].replace(/\s+/g,' ').slice(0,160));
// categories 选项
const catSel = h.match(/<select[^>]*name=["']categories["'][^>]*>([\s\S]{0,3000}?)<\/select>/i);
if (catSel) console.log('CATS:', [...catSel[1].matchAll(/<option[^>]*value=["']?([^"'>]*)["']?[^>]*>([^<]{0,40})/gi)].slice(0,15).map(o=>`${o[1]}=${o[2].trim()}`).join(' | '));
// required 字段
for (const m of h.matchAll(/<(?:input|textarea|select)[^>]*name=["']([^"']+)["'][^>]*>/gi)) {
  const req = /required/.test(m[0]) ? 'REQ' : 'opt';
  console.log(`FIELD ${m[1]} [${req}]`);
}
writeFileSync('D:/Github/seoadminC/storage/_w6_saas_jar.txt', jar);
