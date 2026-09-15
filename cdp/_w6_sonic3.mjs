// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const paths = ['/submission.htm', '/suggest.html', '/addurl.html', '/submit.html', '/site-submission.html', '/submission.html', '/add-site.html', '/addsite.html', '/free-listing.html', '/submit.php'];
for (const p of paths) {
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch('https://www.sonicrun.com' + p, { signal: ctl.signal, headers: H, redirect: 'follow' });
    clearTimeout(timer);
    const h = await r.text();
    const form = h.match(/<form[^>]*>/i)?.[0]?.slice(0,150) || '';
    const fields = [...h.matchAll(/<(?:input|select|textarea)\b[^>]*name=["']?([^"'>\s]+)/gi)].map(m => m[1]);
    if (r.status === 200 && (form || fields.length)) console.log(`${p} HTTP${r.status} len=${h.length} FORM:${form} FIELDS:${[...new Set(fields)].join(',')}`);
    else if (r.status !== 200) console.log(`${p} HTTP${r.status}`);
  } catch (e) { console.log(p, 'ERR', (e.cause?.code || e.message).slice(0,40)); }
}
