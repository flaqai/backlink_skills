// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { readFileSync, writeFileSync } from 'fs';
// DF step2 页面: txtNumber 上下文 + 隐藏字段 + 表单action
const h = readFileSync('D:/Github/seoadminC/storage/_w6_df_step2.html', 'utf8');
const iT = h.indexOf('txtNumber');
console.log('DF txtNumber ctx:', h.slice(Math.max(0,iT-500), iT+300).replace(/\s+/g,' '));
for (const m of h.matchAll(/<input[^>]*type=["']?hidden[^>]*>/gi)) console.log('HIDDEN:', m[0].replace(/\s+/g,' ').slice(0,200));
const fa = h.match(/<form[^>]*>/gi); console.log('FORMS:', fa);
const im = h.match(/<img[^>]*>/gi); if (im) console.log('IMGS:', im.slice(0,6).map(x=>x.slice(0,150)));
// morefunz hidden字段值
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
const i4 = r.indexOf('<form method="post">');
const blk = r.slice(i4, r.indexOf('</form>', i4));
for (const m of blk.matchAll(/<input[^>]*type=["']?hidden[^>]*>/gi)) console.log('MF-HIDDEN:', m[0].replace(/\s+/g,' ').slice(0,200));
// cat2 AJAX 端点: 找 js 里 cat 联动代码
const js = r.match(/cat1[\s\S]{0,80}(change|ajax|load)[\s\S]{0,200}/i);
if (js) console.log('MF cat-js:', js[0].replace(/\s+/g,' ').slice(0,260));
const aj = [...r.matchAll(/["'](\/[a-z_]+\.php[^"']*|[^"']*ajax[^"']*)["']/gi)].map(x=>x[1]).slice(0,10);
console.log('MF ajax-ish:', [...new Set(aj)].join(' , '));
