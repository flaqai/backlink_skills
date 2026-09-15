// letterpad GraphQL: 用cookie查我的posts拿bank873 slug+html锚链证据
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import fs from 'fs';
const cookie = fs.readFileSync('D:/Github/backlink_skills/cookies/default/letterpad.app.json','utf8');
let ck = '';
try { const obj = JSON.parse(cookie); const arr = Array.isArray(obj) ? obj : (obj.cookies || obj.cookies_list || []); ck = arr.map(c=>`${c.name}=${c.value}`).join('; '); } catch { ck = cookie; }
const q = async (query) => {
  const r = await fetch('https://letterpad.app/api/graphql', {
    method:'POST',
    headers:{'Content-Type':'application/json','Cookie':ck,'User-Agent':'Mozilla/5.0 Chrome/153'},
    body: JSON.stringify({query})
  });
  return {code:r.status, body: await r.text()};
};
// 读我的posts列表
let res = await q('{posts{id,title,slug,createdAt}}');
console.log('posts:', res.code, res.body.slice(0,600));
