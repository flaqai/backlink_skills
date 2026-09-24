import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
if (!tab) { tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json(); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// ★拉高视口
await c.send('Emulation.setDeviceMetricsOverride', { width: 1380, height: 2000, deviceScaleFactor: 1, mobile: false });
await c.goto('https://www.strikingly.com/templates?is_new_user=1', 40000).catch(e=>console.log('goto:',e.message));
await sleep(6000);
// 填站名
const hasInput = await c.eval(`(function(){ var i=document.getElementById('focus-input'); if(i){i.focus(); return true;} return false; })()`);
if (hasInput) { await c.send('Input.insertText', { text: "Leo's Notebook" }); await sleep(600); }
// 滚到博客分类点它
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const cat = await c.eval(`(function(){
  const els=[...document.querySelectorAll('a,button,div,span,li')].filter(e=>e.offsetParent && e.children.length<=2 && e.textContent.trim()==='博客');
  if(!els.length) return null; const e=els[els.length-1]; e.scrollIntoView({block:'center'});
  const r=e.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('cat:', cat);
if (cat) { const p=JSON.parse(cat); await clickXY(p.x,p.y); await sleep(2500); }
// 点第一个模板
const bp = await c.eval(`(function(){
  const bs=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && (b.innerText||'').trim()==='开始编辑！');
  if(!bs.length) return null; const b=bs[0]; b.scrollIntoView({block:'center'});
  const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('btn:', bp);
if (!bp) process.exit(1);
const p = JSON.parse(bp);
await clickXY(p.x,p.y);
await sleep(4000);
// anchor位置(现在视口2000高, 模态应居中更低)
const a = await c.eval(`(function(){
  const an=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  if(!an) return 'NO-ANCHOR';
  const r=an.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('anchor:', a);
process.exit(0);
