// 查wp2最新文章状态(draft/pending/published)
import { CDP, sleep } from './CDP.mjs';
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base + '/json/list')).json();
const tab = tabs.find(t => t.type === 'page' && t.url.includes('wordpress.com'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Page.navigate', { url: 'https://leoxmseo2.wordpress.com/wp-admin/edit.php' });
await sleep(9000);
const expr = [
  '(async function(){',
  'var r = await fetch("/wp-json/wp/v2/posts?per_page=3&context=edit", {headers:{"X-WP-Nonce": window.wpApiSettings ? window.wpApiSettings.nonce : (window._wpNonce||"")}, credentials:"include"});',
  'if(!r.ok) return "HTTP"+r.status;',
  'var j = await r.json();',
  'return JSON.stringify(j.map(function(p){return {id:p.id, status:p.status, link:p.link, title:(p.title&&p.title.raw||"").slice(0,40)}}));',
  '})()'
].join('');
const out = await c.evalT(expr, 15000);
console.log(out);
process.exit(0);
