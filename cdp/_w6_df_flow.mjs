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
const collect = (res) => { for (const c of (res.headers.getSetCookie?.() || [])) { const kv = c.split(';')[0]; const name = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(name + '=')); jar.push(kv); } };
const cookieHeader = () => jar.join('; ');

// step0: GET submit页落session
let r = await fetch('https://www.directory-free.com/submit/submit.php', { headers: H });
collect(r); await r.text();
console.log('cookies:', jar.join('; '));

// step1: POST add.php 选分类
r = await fetch('https://www.directory-free.com/submit/add.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: cookieHeader() }, body: 'categorie=' + encodeURIComponent('Business/General') });
collect(r);
const step2 = await r.text();
console.log('step1 HTTP', r.status, 'len', step2.length, 'has insert.php:', step2.includes('insert.php'), 'has txtNumber:', step2.includes('txtNumber'));

// step2: GET 验证码图
r = await fetch('https://www.directory-free.com/submit/randomImage3.php', { headers: { ...H, Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: cookieHeader() } });
collect(r);
const buf = Buffer.from(await r.arrayBuffer());
writeFileSync('D:/Github/seoadminC/storage/_w6_df_captcha.png', buf);
console.log('captcha PNG', buf.length, 'bytes type=', r.headers.get('content-type'));
// 存cookie供下一步
writeFileSync('D:/Github/seoadminC/storage/_w6_df_jar.txt', jar.join('; '));
