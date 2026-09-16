// letterpad introspection: PostsResponse/Query 字段自省
// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

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
