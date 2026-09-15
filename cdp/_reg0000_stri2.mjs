import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.goto('https://www.strikingly.com/s/login', 40000).catch(e => console.log('goto:', e.message));
await sleep(5000);
// 找表单
const st = await c.eval(`(function(){
  const f = document.querySelector('form');
  const inputs = [...document.querySelectorAll('input')].map(i=>({t:i.type,n:i.name,id:i.id,vis:!!(i.offsetParent)}));
  const cap = document.querySelector('.captcha-code, img[class*=captcha], #captcha');
  return JSON.stringify({url:location.href, formAction:f?f.action:null, inputs, captcha:cap?cap.outerHTML.slice(0,200):null});
})()`);
console.log(st);
process.exit(0);
