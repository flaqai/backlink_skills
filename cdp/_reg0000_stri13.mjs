import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 还原我造成的 transform
await c.eval(`(function(){
  [...document.querySelectorAll('div')].forEach(d=>{ if((d.style.transform||'').includes('translateY(437px)')) d.style.transform=''; });
  window.scrollTo(0,0); return 'ok';
})()`);
await sleep(800);
// 点重新加载验证码链接(在anchor iframe的modal里, (554,334)附近)
await clickXY(554,334);
await sleep(4000);
const r = await c.eval(`(function(){
  const bfs=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).map(f=>({y:Math.round(f.getBoundingClientRect().y),h:f.getBoundingClientRect().height}));
  return JSON.stringify(bfs);
})()`);
console.log('bframes after reload:', r);
process.exit(0);
