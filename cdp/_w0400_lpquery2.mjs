// letterpad introspection: PostsResponse/Query 字段自省
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import fs from 'fs';
const cookieFile = 'D:/Github/backlink_skills/cookies/default/letterpad.app.json';
let ck='';
try { const obj = JSON.parse(fs.readFileSync(cookieFile,'utf8')); const arr = Array.isArray(obj)?obj:(obj.cookies||[]); ck = arr.map(c=>`${c.name}=${c.value}`).join('; '); } catch(e) { console.log('cookie parse fail', e.message); }
const q = async (query) => {
  const r = await fetch('https://letterpad.app/api/graphql', {method:'POST',headers:{'Content-Type':'application/json','Cookie':ck,'User-Agent':'Mozilla/5.0 Chrome/153'},body:JSON.stringify({query})});
  return (await r.text()).slice(0,700);
};
console.log('PostsResponse:', await q('{__type(name:"PostsResponse"){fields{name}}}'));
console.log('Query fields:', await q('{__type(name:"Query"){fields{name}}}'));
