import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// recaptcha checkbox 在 iframe 内, 坐标直接点
await clickXY(540,426);
await sleep(5000);
const st = await c.eval(`(function(){
  const modal=document.querySelector('.s-kit-modal, [class*=modal]');
  return JSON.stringify({url:location.href.slice(0,80), modalText: modal? modal.innerText.slice(0,200): null});
})()`);
console.log(st);
process.exit(0);
