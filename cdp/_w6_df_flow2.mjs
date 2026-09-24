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
const grab = (res) => {
  const raw = res.headers.get('set-cookie');
  const list = raw ? raw.split(/,(?=[^;]+?=)/) : [];
  for (const c of list) { const kv = c.split(';')[0].trim(); if (kv.includes('=')) { const n = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(n + '=')); jar.push(kv); } }
};
let r = await fetch('https://www.directory-free.com/submit/submit.php', { headers: H });
grab(r); await r.text();
console.log('after step0 jar:', jar);
r = await fetch('https://www.directory-free.com/submit/add.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar.join('; ') }, body: 'categorie=' + encodeURIComponent('Business/General') });
grab(r); const s2 = await r.text();
console.log('after step1 jar:', jar, '| insert form:', s2.includes('insert.php'));
r = await fetch('https://www.directory-free.com/submit/randomImage3.php', { headers: { ...H, Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar.join('; ') } });
grab(r);
const buf = Buffer.from(await r.arrayBuffer());
writeFileSync('D:/Github/seoadminC/storage/_w6_df_captcha2.png', buf);
console.log('after captcha jar:', jar, '| png', buf.length);
writeFileSync('D:/Github/seoadminC/storage/_w6_df_jar.txt', jar.join('; '));
