// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('https://www.sonicrun.com/', { headers: H });
const h = await r.text();
// 所有链接
const links = [...h.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,60}?)<\/a>/gi)].map(m => m[2].replace(/<[^>]+>/g,'').trim().slice(0,30) + ' → ' + m[1]);
console.log(links.slice(0, 30).join('\n'));
// form?
console.log('\nFORMS:', [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]).join(' || ').slice(0,300));
// 提交字样上下文
for (const mm of h.matchAll(/.{60}[Ss]ubmission.{80}/g)) console.log('CTX:', mm[0].replace(/\s+/g,' '));
