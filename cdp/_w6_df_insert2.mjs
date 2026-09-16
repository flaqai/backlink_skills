// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { readFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const jar = readFileSync('D:/Github/seoadminC/storage/_w6_df_jar.txt', 'utf8').trim();
const code = process.argv[2];
const body = new URLSearchParams({
  catname: 'Business/General',
  linkname: 'Smog Check Near Me - Stations, Prices and STAR Info',
  linkurl: 'https://smogcheck-nearme.com',
  descriere: 'Find smog check stations near you in California, with prices, STAR station info and passing tips. Covers what to expect during the test and common failure causes.',
  email: 'df.smog@92ng.com',
  txtNumber: code,
  Submit: 'Add URL',
});
const res = await fetch('https://www.directory-free.com/submit/insert.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar }, body: body.toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /already/i, /error/i, /wrong/i, /invalid/i, /code/i, /approve/i, /review/i]) {
  const mm = text.match(new RegExp('.{50}' + kw.source + '.{110}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('HEAD:', text.slice(0, 400));
