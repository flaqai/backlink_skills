// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const jar = JSON.parse(readFileSync('D:/Github/backlink_skills/cookies/default/wordpress.com.json', 'utf8'));
const cookies = (jar.cookies || jar).map(c => `${c.name}=${c.value}`).join('; ');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152';
const TITLE = 'Generator Load Management: Run More With Less, Without Tripping the Breaker';
// 先测试认证: me端点
const me = await fetch('https://public-api.wordpress.com/rest/v1.1/me', { headers: { 'Cookie': cookies, 'User-Agent': UA } }).then(r => r.json());
console.log('me:', me.ID || '', me.display_name || me.message || '');
// v2 端点 POST
const res = await fetch('https://public-api.wordpress.com/wp/v2/sites/leoxmseo2.wordpress.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Cookie': cookies, 'User-Agent': UA },
  body: JSON.stringify({ title: TITLE, content: 'test-anchor-check', status: 'draft' })
});
const t = await res.text();
console.log('v2 status:', res.status, t.slice(0, 200));
