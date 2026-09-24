// 抓wp2文章View链接: 避免模板转义坑, 全部走变量拼接
import { CDP, sleep } from './CDP.mjs';
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base + '/json/list')).json();
const tab = tabs.find(t => t.type === 'page' && t.url.includes('wordpress.com'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Page.navigate', { url: 'https://wordpress.com/posts/leoxmseo2.wordpress.com' });
await sleep(10000);
const expr = [
  '(function(){',
  'var N=String.fromCharCode(10);',
  'var links=[...document.querySelectorAll("a")].filter(function(a){',
  'return a.href.indexOf("leoxmseo2.wordpress.com")>=0 && a.href.indexOf("wp-admin")<0 && a.href.indexOf("wp-login")<0;',
  '}).map(function(a){return (a.innerText||"").trim().slice(0,25)+" => "+a.href});',
  'return links.slice(0,10).join(N);',
  '})()'
].join('');
const out = await c.evalT(expr, 12000);
console.log(out);
process.exit(0);
