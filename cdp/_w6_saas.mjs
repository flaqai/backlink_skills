// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
