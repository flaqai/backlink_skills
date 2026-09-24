import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 关闭模态: 找关闭钮
const close = await c.eval(`(function(){
  const cls=[...document.querySelectorAll('.close, .modal-close, [class*=close], button[aria-label]')].filter(b=>b.offsetParent);
  return JSON.stringify(cls.slice(0,6).map(b=>({tag:b.tagName,txt:(b.innerText||'').trim().slice(0,20),cls:(b.className||'').toString().slice(0,50),x:b.getBoundingClientRect().x+b.getBoundingClientRect().width/2,y:b.getBoundingClientRect().y+b.getBoundingClientRect().height/2})));
})()`);
console.log('close candidates:', close);
process.exit(0);
