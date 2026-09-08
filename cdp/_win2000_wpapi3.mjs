import { CDP } from './CDP.mjs';
import { readFileSync } from 'fs';
const html = readFileSync('_win2000_posts/wp204.html', 'utf8');
const title = 'Generator Fuel Types Compared: Propane, Natural Gas, Gasoline and Solar';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('leoxmseo2.wordpress.com/wp-admin/post-new.php'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws超时')), 8000); });
const cdp = new CDP(ws);
await cdp.send('Runtime.enable');
const nonce = await cdp.eval(`window.wpApiSettings.nonce`);
const expr = `(async () => {
  const res = await fetch('https://public-api.wordpress.com/wp/v2/sites/leoxmseo2.wordpress.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': '${nonce}' },
    credentials: 'include',
    body: JSON.stringify({ title: ${JSON.stringify(title)}, content: ${JSON.stringify(html)}, status: 'publish' })
  });
  const j = await res.json().catch(() => ({}));
  return JSON.stringify({ st: res.status, id: j.id, link: j.link, msg: j.message || null });
})()`;
console.log('RESULT:', await cdp.eval(expr));
