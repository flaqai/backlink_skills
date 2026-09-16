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
let jar = [];
const grab = (r) => { for (const c of (r.headers.getSetCookie?.() || [])) { const kv = c.split(';')[0]; const n = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(n+'=')); jar.push(kv); } };
let r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { headers: H });
grab(r); await r.text();
r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.jasminedirectory.com/index.php?a=2070753691', Cookie: jar.join('; ') }, body: new URLSearchParams({ URL__req_url_max100: 'https://qrcodegenerator.vip', submitStandard: 'Standard Listing' }).toString(), redirect: 'follow' });
grab(r);
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length, 'jar:', jar.join(';'));
const forms = [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]);
console.log('FORMS:', forms.join(' || ').slice(0,300));
const fields = [...new Set([...h.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(m => m[1]))];
console.log('FIELDS:', fields.join(','));
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log('TEXT:', text.slice(0,350));
writeFileSync('D:/Github/seoadminC/storage/_w6_jas_step2.html', h);
writeFileSync('D:/Github/seoadminC/storage/_w6_jas_jar.txt', jar.join('; '));
