import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 取第一个可见模板卡的按钮坐标
const pos = await c.eval(`(function(){
  const btns=[...document.querySelectorAll('button.block.s-btn.big.no-border')].filter(b=>b.offsetParent);
  const b=btns[0]; if(!b) return null;
  b.scrollIntoView({block:'center'});
  const r=b.getBoundingClientRect();
  return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
})()`);
console.log('btn pos:', pos);
const {x,y}=JSON.parse(pos);
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
// 等编辑器加载
for (let i=0;i<8;i++){
  await sleep(3000);
  const u = await c.eval(`location.href`);
  if (!String(u).includes('/templates')) { console.log('URL:',u); break; }
  console.log('waiting...', u);
}
const st = await c.eval(`document.body.innerText.slice(0,500)`);
console.log('state:', st);
process.exit(0);
