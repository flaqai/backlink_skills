// win1200: otter 发银行稿262(USB PD → spravs锚)
// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

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
