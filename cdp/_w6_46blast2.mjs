// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync } from 'fs';
const DOMS = ['businessfreedirectory.com','bestdirectory4you.com','addgoodsites.com','alive-directory.com','bedirectory.com','adbritedirectory.com','hotdirectory.net','addirectory.org','beegdirectory.com','clicksordirectory.com','sublimedir.net','poordirectory.com','ask-directory.com','upsdirectory.com','bing-directory.com'];
const results = [];
for (const d of DOMS) {
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 15000);
    let path = '/submit';
    let r = await fetch(`https://www.${d}${path}`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' }, redirect: 'follow' });
    let h = await r.text();
    if (r.status === 404) { path = '/submit.php'; r = await fetch(`https://www.${d}${path}`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' }); h = await r.text(); }
    clearTimeout(timer);
    const fields = [...new Set([...h.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(m => m[1]))];
    const full = fields.filter(f => /TITLE|URL|OWNER|DESCRIPTION|categorie/i.test(f));
    const cap = /name="CAPTCHA"|image_verification|captcha/i.test(h);
    console.log(`${d} ${r.status} ${path} fullForm=${full.length>0 ? 'Y('+full.slice(0,5).join('|')+')' : 'n'} cap=${cap?'Y':'n'} allFields=${fields.slice(0,6).join(',')}`);
    results.push({ d, code: r.status, path, full: full.length > 0, cap, fields });
  } catch (e) { console.log(`${d} ERR ${(e.cause?.code||e.message).slice(0,30)}`); }
}
writeFileSync('D:/Github/seoadminC/storage/_w6_46blast2.json', JSON.stringify(results));
