// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
let jar = [];
const collect = (res) => { for (const c of (res.headers.getSetCookie?.() || [])) { const kv = c.split(';')[0]; const name = kv.split('=')[0]; jar = jar.filter(x => !x.startsWith(name + '=')); jar.push(kv); } };
const cookieHeader = () => jar.join('; ');

// step0: GET submit页落session
let r = await fetch('https://www.directory-free.com/submit/submit.php', { headers: H });
collect(r); await r.text();
console.log('cookies:', jar.join('; '));

// step1: POST add.php 选分类
r = await fetch('https://www.directory-free.com/submit/add.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: cookieHeader() }, body: 'categorie=' + encodeURIComponent('Business/General') });
collect(r);
const step2 = await r.text();
console.log('step1 HTTP', r.status, 'len', step2.length, 'has insert.php:', step2.includes('insert.php'), 'has txtNumber:', step2.includes('txtNumber'));

// step2: GET 验证码图
r = await fetch('https://www.directory-free.com/submit/randomImage3.php', { headers: { ...H, Referer: 'https://www.directory-free.com/submit/submit.php', Cookie: cookieHeader() } });
collect(r);
const buf = Buffer.from(await r.arrayBuffer());
writeFileSync('D:/Github/seoadminC/storage/_w6_df_captcha.png', buf);
console.log('captcha PNG', buf.length, 'bytes type=', r.headers.get('content-type'));
// 存cookie供下一步
writeFileSync('D:/Github/seoadminC/storage/_w6_df_jar.txt', jar.join('; '));
