import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(540,426);
await sleep(5000);
const r = await c.eval(`(function(){
  const bfs=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).map(f=>({y:Math.round(f.getBoundingClientRect().y),h:f.getBoundingClientRect().height}));
  return JSON.stringify(bfs);
})()`);
console.log('bframes:', r);
process.exit(0);
