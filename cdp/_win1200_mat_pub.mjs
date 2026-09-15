// win1200 mataroa发文: check-engine-light-smog-check → leoxm.mataroa.blog (锚链smogcheck-nearme.com)
// Django表单: GET /new/post/ 取csrftoken, 带jar会话POST
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const jar = JSON.parse(readFileSync('D:/Github/backlink_skills/cookies/default/mataroa.blog.json', 'utf8'));
const cookieStr = jar.cookies.filter(c => /mataroa/.test(c.domain)).map(c => `${c.name}=${c.value}`).join('; ');
const H = { Cookie: cookieStr, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152.0' };

// 1. GET表单页取csrf
const g = await fetch('https://mataroa.blog/new/post/', { headers: H });
console.log('GET', g.status, '→', g.url.slice(0, 60));
const html = await g.text();
const csrf = (html.match(/name="csrfmiddlewaretoken" value="([^"]+)"/) || [])[1];
if (!csrf) { console.log('NO CSRF. head:', html.slice(0, 200)); process.exit(1); }
console.log('csrf ok len', csrf.length);

// 2. 准备正文
let md = readFileSync('D:/Github/backlink_skills/blog-articles/check-engine-light-smog-check/article.md', 'utf8');
md = md.split('\n---\n')[0];
const lines = md.split('\n');
const title = lines[0].replace(/^#\s+/, '');
const body = lines.slice(1).join('\n').trim();

// 3. POST发布
const fd = new URLSearchParams();
fd.set('csrfmiddlewaretoken', csrf);
fd.set('title', title);
fd.set('body', body);
// 表单可能有slug字段——从html里探
const slugField = (html.match(/name="(slug[^"]*)"/) || [])[1];
if (slugField) fd.set(slugField, 'check-engine-light-smog-check');
const extra = [...html.matchAll(/<input[^>]*name="([^"]+)"[^>]*type="hidden"[^>]*>/g)].map(m => m[1]);
for (const name of extra) { if (name !== 'csrfmiddlewaretoken') { const v = (html.match(new RegExp('name="' + name + '" value="([^"]*)"')) || [])[1] || ''; fd.set(name, v); } }

const p = await fetch('https://mataroa.blog/new/post/', {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://mataroa.blog/new/post/' },
  body: fd.toString(), redirect: 'follow'
});
console.log('POST', p.status, '→', p.url.slice(0, 90));
const pt = await p.text();
if (/check-engine|smog/i.test(pt)) console.log('★正文出现在响应页');
if (/error|invalid/i.test(pt.slice(0, 2000))) console.log('疑错误:', pt.slice(0, 300).replace(/\n/g, ' '));
