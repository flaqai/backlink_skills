import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates/blog'));
if (!tab) tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const btns = await c.eval(`(function(){
  const bs=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && (b.innerText||'').includes('开始编辑'));
  if(!bs.length) return null;
  const b=bs[0]; b.scrollIntoView({block:'center'});
  const r=b.getBoundingClientRect();
  return JSON.stringify({n:bs.length,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('btns:', btns);
if(!btns){console.log('NO BTN');process.exit(1);}
const {x,y}=JSON.parse(btns);
await clickXY(x,y);
// 等跳编辑器
for (let i=0;i<10;i++){
  await sleep(3000);
  const u = await c.eval(`location.href`);
  console.log(i, String(u).slice(0,90));
  if (/\/s\/sites|editor|\/d\//.test(String(u))) break;
}
process.exit(0);
