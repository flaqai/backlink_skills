// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
