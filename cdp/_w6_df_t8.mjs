// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync, readFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' };
let r = await fetch('https://www.directory-free.com/submit/submit.php', { headers: H });
let jar = [];
const grab = (res) => { for (const c of (res.headers.getSetCookie?.() || [])) { const kv = c.split(';')[0]; const n = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(n + '=')); jar.push(kv); } };
grab(r); await r.text();
r = await fetch('https://www.directory-free.com/submit/add.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar.join('; ') }, body: 'categorie=' + encodeURIComponent('Computers/Internet') });
grab(r); await r.text();
r = await fetch('https://www.directory-free.com/submit/randomImage3.php', { headers: { ...H, Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: jar.join('; ') } });
grab(r);
const buf = Buffer.from(await r.arrayBuffer());
writeFileSync('D:/Github/seoadminC/storage/_w6_df_t8_cap.png', buf);
writeFileSync('D:/Github/seoadminC/storage/_w6_df_t8_jar.txt', jar.join('; '));
console.log('captcha ready', buf.length, 'jar:', jar.join(';'));
