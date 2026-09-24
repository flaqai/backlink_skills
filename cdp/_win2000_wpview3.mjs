// 从wp-admin/edit.php抓文章View链接
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
await sleep(10000);
const expr = [
  '(function(){',
  'var N=String.fromCharCode(10);',
  'var out=[];',
  'var rows=[...document.querySelectorAll("tr")];',
  'rows.forEach(function(r){',
  '  var t=r.querySelector("a.row-title");',
  '  if(!t)return;',
  '  var acts=[...r.querySelectorAll("a")].filter(function(a){return a.innerText.trim()==="View"});',
  '  out.push("TITLE="+t.innerText.trim().slice(0,50)+" | VIEW="+(acts.length?acts[0].href:"none"));',
  '});',
  'return out.slice(0,6).join(N);',
  '})()'
].join('');
const out = await c.evalT(expr, 12000);
console.log(out);
process.exit(0);
