// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
