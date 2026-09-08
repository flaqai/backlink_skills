import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('paper.wf'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
console.log(await c.eval(`(() => JSON.stringify({
  url: location.href,
  textareas: document.querySelectorAll('textarea').length,
  editables: document.querySelectorAll('[contenteditable=true]').length,
  forms: document.querySelectorAll('form').length,
  h1: (document.querySelector('h1')||{}).textContent?.trim()?.slice(0,50),
  bodyHead: document.body.innerText.slice(0, 200)
}))()`));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('_win2000_paper.jpg', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
