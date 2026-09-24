import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=25'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1000);
const js = `(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  const anchors = [...d.querySelectorAll('a')].map(a => a.href);
  const txt = (d.querySelector('.block-editor-block-list__layout')?.innerText || '');
  return JSON.stringify({ anchors, hasGen: /generatorforhouse/.test(txt), textLen: txt.length, sample: txt.slice(0, 150) });
})()`;
console.log(await c.eval(js));
