// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' };
const jar = readFileSync('D:/Github/seoadminC/storage/_w6_df_t8_jar.txt', 'utf8').trim();
const body = new URLSearchParams({
  catname: 'Computers/Internet',
  linkname: 'Generator For House - Sizing, Costs and Brand Guides',
  linkurl: 'https://generatorforhouse.org',
  descriere: 'Practical guide to home backup power: portable generator sizing by wattage, running cost breakdowns, inverter vs conventional comparisons, brand roundups and cold-weather safety tips for homeowners.',
  email: 'df.gen@92ng.com',
  txtNumber: '4891',
  Submit: 'Add URL',
});
const res = await fetch('https://www.directory-free.com/submit/insert.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar }, body: body.toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const mm = text.match(/.{40}(?:thank|added|error|wrong|invalid|already).{100}/i);
if (mm) console.log('VERDICT:', mm[0].trim());
