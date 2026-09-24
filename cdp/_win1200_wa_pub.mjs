// win1200 write.as API发文: car-charger-buying-guide → write.as/leoxm (锚链spravs.com)
// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

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
