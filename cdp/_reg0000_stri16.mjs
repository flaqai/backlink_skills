import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 关掉当前AI模态(如果开着) — 点X
const xc = await c.eval(`(function(){
  const x=document.querySelector('.s-kit-modal-close'); if(x&&x.offsetParent){const r=x.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});} return null;
})()`);
if(xc){ const p=JSON.parse(xc); await clickXY(p.x,p.y); await sleep(1200); }
// 滚到模板区, 点 博客 分类
await c.eval(`(function(){
  const els=[...document.querySelectorAll('a,button,div,span,li')].filter(e=>e.offsetParent && e.children.length<=2 && e.textContent.trim()==='博客');
  if(els.length){ const e=els[els.length-1]; e.scrollIntoView({block:'center'}); }
  return 'ok';
})()`);
await sleep(1200);
const cat = await c.eval(`(function(){
  const els=[...document.querySelectorAll('a,button,div,span,li')].filter(e=>e.offsetParent && e.children.length<=2 && e.textContent.trim()==='博客');
  if(!els.length) return null; const e=els[els.length-1]; const r=e.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('cat:', cat);
if(cat){ const p=JSON.parse(cat); await clickXY(p.x,p.y); await sleep(2500); }
// 第一个可见的 开始编辑
const bp = await c.eval(`(function(){
  const bs=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && (b.innerText||'').trim()==='开始编辑！');
  if(!bs.length) return null; const b=bs[0]; b.scrollIntoView({block:'center'});
  const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),n:bs.length});
})()`);
console.log('btn:', bp);
if(!bp) process.exit(1);
const p=JSON.parse(bp); await clickXY(p.x,p.y);
await sleep(4000);
// 确认anchor存在
let anchorState = await c.eval(`(function(){
  const a=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  if(!a) return 'NO-ANCHOR';
  const r=a.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('anchor:', anchorState);
if(anchorState==='NO-ANCHOR') process.exit(2);
// 下移模态
await c.eval(`(function(){
  const a=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  let el=a; let moved=false;
  for(let k=0;k<10 && el;k++){ if(String(el.className||'').includes('s-kit-modal')) break; el=el.parentElement; }
  if(el){ el.style.setProperty('transform','translateY(320px)','important'); moved=true; }
  return moved;
})()`);
await sleep(1000);
const a2 = JSON.parse(await c.eval(`(function(){
  const a=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  const r=a.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`));
console.log('anchor after move:', a2);
// 点checkbox
await clickXY(a2.x-132, a2.y); // checkbox在anchor框左半
await sleep(6000);
const bf = await c.eval(`(function(){
  const big=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).find(f=>f.getBoundingClientRect().height>300);
  return big? JSON.stringify({y:Math.round(big.getBoundingClientRect().y)}) : 'no-big-bframe';
})()`);
console.log('bframe:', bf);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-s9.png', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
process.exit(0);
