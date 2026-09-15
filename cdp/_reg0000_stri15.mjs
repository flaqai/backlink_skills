import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 全新加载
await c.goto('https://www.strikingly.com/templates?is_new_user=1', 40000).catch(e=>console.log('goto:',e.message));
await sleep(6000);
await c.eval(`document.getElementById('focus-input').focus(); 'ok'`).catch(()=>console.log('no focus-input'));
await c.send('Input.insertText', { text: "Leo's Notebook" });
await sleep(600);
const bp = await c.eval(`(function(){
  const bs=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && (b.innerText||'').includes('开始编辑'));
  if(!bs.length) return null; const b=bs[0];
  const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
if(!bp){ console.log('no btn'); process.exit(1); }
await clickXY(...Object.values(JSON.parse(bp)));
await sleep(3500);
// 模态下移: anchor从389挪到~700
const mv = await c.eval(`(function(){
  const anchor=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  if(!anchor) return 'no-anchor';
  let el=anchor; let modal=null;
  for(let k=0;k<8 && el.parentElement;k++){ el=el.parentElement; if(el.className && String(el.className).includes('s-kit-modal')) { modal=el; break; } }
  const target = modal || el;
  target.style.setProperty('transform','translateY(300px)','important');
  const ay=anchor.getBoundingClientRect().y;
  return JSON.stringify({moved:!!modal, anchorY:Math.round(ay)});
})()`);
console.log('modal move:', mv);
await sleep(1000);
const ay2 = await c.eval(`(function(){
  const anchor=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  const r=anchor.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)});
})()`);
console.log('anchor now:', ay2);
process.exit(0);
