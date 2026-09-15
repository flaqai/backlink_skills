// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('https://www.sonicrun.com/freelisting.html', { headers: H });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length, 'final', r.url);
const forms = [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]);
console.log('FORMS:', forms.join(' || '));
for (const m of h.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
  const s = m[0].replace(/\s+/g,' ');
  console.log(' ', s.slice(0,170));
}
// turnstile/recaptcha 痕迹
for (const mm of h.matchAll(/.{60}(turnstile|recaptcha|cf-challenge|sitekey).{100}/gi)) console.log('CAP-CTX:', mm[0].replace(/\s+/g,' ').slice(0,200));
