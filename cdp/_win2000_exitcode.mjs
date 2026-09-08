import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('leoxmseo2'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const r = await c.eval(`(() => {
  const el = [...document.querySelectorAll('button, a')].find(e => /exit code editor/i.test(e.innerText));
  if (!el) return 'nf';
  el.click(); return 'clicked';
})()`);
console.log('exit-code-editor:', r);
await sleep(4000);
const chk = await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas' && f.contentDocument);
  return f && f.contentDocument.querySelector('h1.wp-block-post-title') ? 'canvas-ready' : 'still-no';
})()`);
console.log('canvas:', chk);
