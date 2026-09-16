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
const html = readFileSync('D:/Github/seoadminC/storage/tmp/_w0400_wp899.html', 'utf8');
const toBlocks = (h) => {
  const blocks = [];
  const paras = h.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  for (const p of paras) {
    if (p.startsWith('<h2>')) blocks.push('<!-- wp:heading --><h2>' + p.replace(/^<h2>|<\/h2>$/g, '') + '</h2><!-- /wp:heading -->');
    else if (p.startsWith('<h3>')) blocks.push('<!-- wp:heading {"level":3} --><h3>' + p.replace(/^<h3>|<\/h3>$/g, '') + '</h3><!-- /wp:heading -->');
    else blocks.push('<!-- wp:paragraph --><p>' + p.replace(/^<p>|<\/p>$/g, '') + '</p><!-- /wp:paragraph -->');
  }
  return blocks.join('\n\n');
};
const res = await fetch('https://public-api.wordpress.com/rest/v1.1/sites/leoxmseo2.wordpress.com/posts/new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152',
    'Origin': 'https://wordpress.com',
    'Referer': 'https://wordpress.com/'
  },
  body: JSON.stringify({ title: 'Generator Load Management: Run More With Less, Without Tripping the Breaker', content: toBlocks(html), status: 'publish' })
});
const t = await res.text();
console.log('status:', res.status);
try { const j = JSON.parse(t); console.log('ID:', j.ID, 'URL:', j.URL, 'err:', j.message || ''); } catch(e) { console.log(t.slice(0, 200)); }
