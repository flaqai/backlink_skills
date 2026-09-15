// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
let jar = [];
const grab = (r) => { for (const c of (r.headers.getSetCookie?.() || [])) { const kv = c.split(';')[0]; const n = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(n+'=')); jar.push(kv); } };
let r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { headers: H });
grab(r); await r.text();
r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.jasminedirectory.com/index.php?a=2070753691', Cookie: jar.join('; ') }, body: new URLSearchParams({ URL__req_url_max100: 'https://qrcodegenerator.vip', submitStandard: 'Standard Listing' }).toString(), redirect: 'follow' });
grab(r);
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length, 'jar:', jar.join(';'));
const forms = [...h.matchAll(/<form[^>]*>/gi)].map(m => m[0]);
console.log('FORMS:', forms.join(' || ').slice(0,300));
const fields = [...new Set([...h.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(m => m[1]))];
console.log('FIELDS:', fields.join(','));
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log('TEXT:', text.slice(0,350));
writeFileSync('D:/Github/seoadminC/storage/_w6_jas_step2.html', h);
writeFileSync('D:/Github/seoadminC/storage/_w6_jas_jar.txt', jar.join('; '));
