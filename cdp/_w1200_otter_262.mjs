// win1200: otter 发银行稿262(USB PD → spravs锚)
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const raw = readFileSync('D:/Github/seoadminC/storage/_w0400_bodies/262.body', 'utf8');
const title = raw.match(/^TITLE: (.+)$/m)[1].trim();
let body = raw.split(/=====BODY=====\r*\n/)[1].trim();
// HTML锚 → markdown锚(spravs)
body = body.replace(/<a[^>]*href="(https:\/\/spravs\.com[^"]*)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');
const anchors = (body.match(/\[([^\]]+)\]\(https:\/\/spravs\.com[^)]*\)/g) || []).length;
console.log('title:', title.slice(0,60), '| words:', body.split(/\s+/).length, '| md-anchors:', anchors);
if (!anchors) { console.log('NO_ANCHOR_AFTER_CONVERT'); process.exit(1); }
const login = await fetch('https://write.otter.homes/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({alias:'leoxm', pass:'Xx@Otter26!Xm'}) });
const lj = await login.json();
const token = lj.data?.access_token;
console.log('login:', login.status, token ? 'OK' : JSON.stringify(lj).slice(0,100));
if (!token) process.exit(2);
const pub = await fetch('https://write.otter.homes/api/posts', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Token '+token}, body: JSON.stringify({title, body}) });
const pj = await pub.json();
const id = pj.data?.id;
console.log('publish:', pub.status, 'id=', id, 'url=https://write.otter.homes/'+id);
const chk = await fetch('https://write.otter.homes/'+id);
const html = await chk.text();
console.log('verify:', chk.status, 'anchor-live:', html.includes('spravs.com'));
