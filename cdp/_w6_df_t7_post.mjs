// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { readFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' };
const jar = readFileSync('D:/Github/seoadminC/storage/_w6_df_t8_jar.txt', 'utf8').trim();
const body = new URLSearchParams({
  catname: 'Business/General',
  linkname: 'ZA Bank Account Opening Guide for Hong Kong Arrivals',
  linkurl: 'https://zakaihu.com',
  descriere: 'Practical guide to opening a ZA Bank account in Hong Kong: requirements, app onboarding flow, address proof and the honest timeline for new arrivals.',
  email: 'df.zak@92ng.com',
  txtNumber: '9783',
  Submit: 'Add URL',
});
const res = await fetch('https://www.directory-free.com/submit/insert.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar }, body: body.toString() });
const html = await res.text();
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const mm = text.match(/.{40}(?:thank you|added|error|wrong|invalid|already).{100}/i);
console.log('HTTP', res.status, '|', mm ? mm[0].trim() : text.slice(0,150));
