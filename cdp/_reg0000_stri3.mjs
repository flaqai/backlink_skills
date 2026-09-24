import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
if (!tab) { console.log('no template tab'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// focus + 真实打字
await c.eval(`(function(){ var i=document.getElementById('focus-input'); if(i){ i.focus(); } return i?'focused':'nf'; })()`);
await c.send('Input.insertText', { text: "Leo's Notebook" });
await sleep(800);
// 找确认按钮
const btns = await c.eval(`(function(){
  return JSON.stringify([...document.querySelectorAll('button, a.btn, input[type=submit], .btn')].filter(b=>b.offsetParent).map(b=>({t:b.tagName,txt:(b.innerText||b.value||'').trim().slice(0,30),cls:(b.className||'').toString().slice(0,60)})).slice(0,15));
})()`);
console.log('buttons:', btns);
const state = await c.eval(`(function(){ var i=document.getElementById('focus-input'); return i ? i.value : 'gone'; })()`);
console.log('siteName value:', state);
process.exit(0);
