// win1200 write.as API发文: car-charger-buying-guide → write.as/leoxm (锚链spravs.com)
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const token = readFileSync('D:/Github/backlink_skills/cdp/_win1200_wa_token.txt', 'utf8').trim();
let md = readFileSync('D:/Github/backlink_skills/blog-articles/car-charger-buying-guide/article.md', 'utf8');
md = md.split('\n---\n')[0]; // 去SEO尾注
// 首行 # 标题提出来作title字段
const lines = md.split('\n');
const title = lines[0].replace(/^#\s+/, '');
const body = lines.slice(1).join('\n').trim();

const r = await fetch('https://write.as/api/collections/leoxm/posts', {
  method: 'POST',
  headers: { 'Authorization': 'Token ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, body })
});
console.log('HTTP', r.status);
const j = await r.json();
if (j.data && j.data.url) {
  console.log('URL:', j.data.url);
  console.log('slug:', j.data.slug);
} else console.log(JSON.stringify(j).slice(0, 400));
