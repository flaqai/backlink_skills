// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

/**
 * _w0400_wf.mjs — writefreely系API发文: node _w0400_wf.mjs <domain> <alias> <pass>
 * 登录拿token → 校验collection → 发 _w0400_body.md 到 /api/collections/<alias>/posts → 返回URL
 */
import fs from 'fs';
const domain = process.argv[2], alias = process.argv[3], pass = process.argv[4];
const cur = JSON.parse(fs.readFileSync('D:/Github/seoadminC/storage/_w0400_cur.json', 'utf-8'));
const body = fs.readFileSync('D:/Github/seoadminC/storage/_w0400_body.md', 'utf-8');

const login = await fetch(`https://${domain}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ alias, pass })
});
const lj = await login.json().catch(() => ({}));
const token = lj.access_token || lj.data?.access_token;
if (!token) { console.log(JSON.stringify({ status: 'FAIL', err: 'login', code: login.status, body: lj })); process.exit(1); }

const col = await fetch(`https://${domain}/api/collections/${alias}`);
if (!col.ok) { console.log(JSON.stringify({ status: 'FAIL', err: 'collection-missing', code: col.status })); process.exit(1); }

const pub = await fetch(`https://${domain}/api/collections/${alias}/posts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Token ' + token },
  body: JSON.stringify({ title: cur.title, body })
});
const pj = await pub.json().catch(() => ({}));
if (!pub.ok) { console.log(JSON.stringify({ status: 'FAIL', err: 'publish', code: pub.status, body: pj })); process.exit(1); }
const url = `https://${domain}/${alias}/${pj.post.id}`;
console.log(JSON.stringify({ status: 'OK', url, slug: pj.post.id }));
process.exit(0);
