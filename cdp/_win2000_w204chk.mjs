import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('leoxmseo2'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1500);
const js = `(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  if (!f || !f.contentDocument) return JSON.stringify({ canvas: 'no' });
  const d = f.contentDocument;
  return JSON.stringify({ title: (d.querySelector('h1.wp-block-post-title')?.innerText||'').slice(0,50), textLen: (d.querySelector('.block-editor-block-list__layout')?.innerText||'').length, blocks: d.querySelectorAll('[data-block]').length });
})()`;
console.log(await c.eval(js));
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_w204chk.jpg', Buffer.from(s.data, 'base64'));
