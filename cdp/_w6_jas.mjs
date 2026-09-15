// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { headers: H, redirect: 'follow' });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length, 'final', r.url.slice(0,70));
const forms = [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]);
console.log('FORMS:', forms.join(' || ').slice(0,300));
for (const m of h.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
  const s = m[0].replace(/\s+/g,' ');
  if (/type=["']?hidden/i.test(s) && !/csrf|token/i.test(s)) continue;
  console.log(' ', s.slice(0,170));
}
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log('TEXT:', text.slice(0,400));
