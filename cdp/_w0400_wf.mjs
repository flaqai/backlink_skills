// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
