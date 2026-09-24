// 页面上下文 REST 发布 leoxmseo2 (2026-09-02 win2000)
import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const html = readFileSync('_win2000_posts/wp204.html', 'utf8');
const title = 'Generator Fuel Types Compared: Propane, Natural Gas, Gasoline and Solar';

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('leoxmseo2.wordpress.com/wp-admin/post-new.php'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws超时')), 8000); });
const cdp = new CDP(ws);
await cdp.send('Runtime.enable');

const expr = `(async () => {
  const nonce = window.wpApiSettings?.nonce || (document.querySelector('#_wpnonce')?.value);
  let n = nonce;
  if (!n) {
    const r = await fetch('/wp-admin/post-new.php?post_type=post');
    const t = await r.text();
    const m = t.match(/"nonce":"([a-f0-9]+)"/) || t.match(/createNonceSalt[^;]*?/) || t.match(/wp-api-request[^>]*data-nonce="([a-f0-9]+)"/);
    n = m ? m[1] : null;
    const m2 = t.match(/rest_nonce['"]?\s*[:=]\s*['"]([a-f0-9]{8,})/) || t.match(/_wpnonce(?:=|"|')(?:value=")?([a-f0-9]{8,})/);
    if (!n && m2) n = m2[1];
  }
  if (!n) return JSON.stringify({ err: 'no-nonce' });
  const res = await fetch('/wp/v2/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': n },
    body: JSON.stringify({ title, content: html, status: 'publish' })
  });
  const j = await res.json().catch(() => ({}));
  return JSON.stringify({ st: res.status, id: j.id, link: j.link, msg: j.message || null });
})()`;
console.log('RESULT:', await cdp.eval(expr));
