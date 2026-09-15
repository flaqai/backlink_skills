// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('http://46-directories.directoriesadvertising.com/advertising-46-directories.php', { headers: H });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length);
const links = [...h.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']*directoriesadvertising[^"']*)["'][^>]*>([\s\S]{0,60}?)<\/a>/gi)].map(m => m[2].replace(/<[^>]+>/g,'').trim() + ' → ' + m[1]);
console.log([...new Set(links)].slice(0, 30).join('\n'));
if (!links.length) {
  const t = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  console.log('TEXT:', t.slice(0, 600));
}
