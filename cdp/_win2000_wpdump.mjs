import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post-new.php'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1500);
const js = `(() => {
  const out = { editables: [], headings: [], iframes: [], title_like: [] };
  document.querySelectorAll('[contenteditable="true"]').forEach(e => out.editables.push(e.tagName + '.' + String(e.className||'').slice(0,60) + ' :: ' + String(e.getAttribute('aria-label')||e.getAttribute('placeholder')||'').slice(0,40)));
  document.querySelectorAll('h1,h2').forEach(e => out.headings.push(e.tagName + '.' + String(e.className||'').slice(0,60)));
  document.querySelectorAll('iframe').forEach(e => out.iframes.push(String(e.title||e.name||'') + ' ' + String(e.src||'').slice(0,70)));
  document.querySelectorAll('[aria-label]').forEach(e => { const a = String(e.getAttribute('aria-label')||'').toLowerCase(); if (a.indexOf('title') >= 0 || a.indexOf('标题') >= 0) out.title_like.push(e.tagName + ' :: ' + a.slice(0,50)); });
  return JSON.stringify(out, null, 1);
})()`;
console.log(await c.eval(js));
