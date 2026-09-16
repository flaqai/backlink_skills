// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { writeFileSync } from 'fs';
const DOMS = ['businessfreedirectory.com','bestdirectory4you.com','addgoodsites.com','alive-directory.com','bedirectory.com','adbritedirectory.com','hotdirectory.net','addirectory.org','beegdirectory.com','clicksordirectory.com','sublimedir.net','poordirectory.com','ask-directory.com','upsdirectory.com','bing-directory.com'];
const results = [];
for (const d of DOMS) {
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 15000);
    let path = '/submit';
    let r = await fetch(`https://www.${d}${path}`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' }, redirect: 'follow' });
    let h = await r.text();
    if (r.status === 404) { path = '/submit.php'; r = await fetch(`https://www.${d}${path}`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' }); h = await r.text(); }
    clearTimeout(timer);
    const fields = [...new Set([...h.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(m => m[1]))];
    const full = fields.filter(f => /TITLE|URL|OWNER|DESCRIPTION|categorie/i.test(f));
    const cap = /name="CAPTCHA"|image_verification|captcha/i.test(h);
    console.log(`${d} ${r.status} ${path} fullForm=${full.length>0 ? 'Y('+full.slice(0,5).join('|')+')' : 'n'} cap=${cap?'Y':'n'} allFields=${fields.slice(0,6).join(',')}`);
    results.push({ d, code: r.status, path, full: full.length > 0, cap, fields });
  } catch (e) { console.log(`${d} ERR ${(e.cause?.code||e.message).slice(0,30)}`); }
}
writeFileSync('D:/Github/seoadminC/storage/_w6_46blast2.json', JSON.stringify(results));
