// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const res = await fetch('https://www.sonicrun.com/cgi-bin/v.cgi?e=sr.zak%4092ng.com&c=n7R6f3', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.sonicrun.com/cgi-bin/v.cgi?e=sr.zak@92ng.com&c=n7R6f3' }, body: 'terms=YES' });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /accepted/i, /listed/i, /added/i, /success/i, /review/i, /error/i, /invalid/i, /will be/i, /verify/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{110}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('HEAD:', text.slice(0, 450));
