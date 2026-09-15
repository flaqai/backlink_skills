// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const jar = JSON.parse(readFileSync('D:/Github/backlink_skills/cookies/default/writeupcafe.com.json', 'utf8'));
const cookieStr = (jar.cookies || jar).map(c => `${c.name}=${c.value}`).join('; ');
const body = readFileSync('D:/Github/seoadminC/storage/tmp/_w0400_wc_body.html', 'utf8');
const meta = readFileSync('D:/Github/seoadminC/storage/tmp/_w0400_wc_meta.txt', 'utf8').split('\n');
const draftId = meta[0].trim();
const TITLE = meta.slice(1).join('\n').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/152';
const H = { 'Cookie': cookieStr, 'User-Agent': UA };
const nonce = await fetch('https://writeupcafe.com/wp-admin/admin-ajax.php?action=rest-nonce', { headers: H }).then(r => r.text());
console.log('nonce:', nonce.trim().slice(0, 15), 'len', nonce.trim().length);
const res = await fetch('https://writeupcafe.com/wp-json/wp/v2/posts', {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json', 'X-WP-Nonce': nonce.trim() },
  body: JSON.stringify({ title: TITLE, content: body.replace(/\n\n+/g, '\n'), status: 'publish' })
});
const t = await res.text();
let j = null; try { j = JSON.parse(t); } catch(e) {}
if (j && j.link) {
  console.log('PUBLISHED_URL=' + j.link + ' status=' + j.status);
  const page = await fetch(j.link, { headers: H }).then(r => r.text());
  const hit = /href="https?:\/\/(www\.)?smogcheck-nearme\.com["\/]/i.test(page);
  console.log('ANCHOR=' + (hit ? 'HIT' : 'MISS') + ' size=' + page.length);
  if (hit) {
    const m = await fetch('http://127.0.0.1/api/seo1/blog-writer/posts/' + draftId + '/mark-published', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({published_url: j.link}) }).then(r => r.json());
    console.log('MARK:', JSON.stringify(m).slice(0, 60));
  }
} else {
  console.log('API_FAIL', res.status, t.slice(0, 200));
}
