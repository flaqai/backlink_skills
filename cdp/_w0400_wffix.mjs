// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import fs from 'fs';
const [domain, alias, postId, pass] = process.argv.slice(2);
const login = await fetch(`https://${domain}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({alias, pass}) });
const lj = await login.json();
const token = lj.access_token || lj.data?.access_token;
const r = await fetch(`https://${domain}/api/collections/${alias}/posts`);
const cj = await r.json();
const posts = cj.data?.posts || cj.posts || [];
const post = posts.find(p => p.id === postId);
if (!post) { console.log(JSON.stringify({status:'FAIL', err:'post-not-in-list', have: posts.map(p=>p.id)})); process.exit(1); }
const re = new RegExp('<a href="https:\/\/' + 'smogcheck-nearme\.com">(\[smog check near me\]\(https:\/\/' + 'smogcheck-nearme\.com\/\))<\/a>', 'g');
const body = post.body.replace(re, '$1');
const changed = body !== post.body;
if (!changed) { console.log(JSON.stringify({status:'NOCHANGE'})); process.exit(0); }
const up = await fetch(`https://${domain}/api/collections/${alias}/posts/${postId}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token },
  body: JSON.stringify({ body })
});
console.log(JSON.stringify({ status: up.ok ? 'OK' : 'FAIL', code: up.status }));
