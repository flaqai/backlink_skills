import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(852,343); // 关模态
await sleep(1500);
// 点"博客"分类
const cat = await c.eval(`(function(){
  const els=[...document.querySelectorAll('a,button,div,span,li')].filter(e=>e.offsetParent && e.children.length<=2 && e.textContent.trim()==='博客');
  if(!els.length) return null;
  const e=els[els.length-1]; e.scrollIntoView({block:'center'});
  const r=e.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2,tag:e.tagName});
})()`);
console.log('博客 category:', cat);
if (cat) { const {x,y}=JSON.parse(cat); await clickXY(x,y); await sleep(2500); }
// 博客模板列表
const tpls = await c.eval(`(function(){
  const names=[...document.querySelectorAll('*')].filter(e=>e.offsetParent && e.children.length===0 && /^[A-Z][A-Z &'.]{3,25}$/.test(e.textContent.trim()));
  return JSON.stringify([...new Set(names.map(n=>n.textContent.trim()))].slice(0,20));
})()`);
console.log('blog templates:', tpls);
process.exit(0);
