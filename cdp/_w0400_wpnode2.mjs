// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

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
