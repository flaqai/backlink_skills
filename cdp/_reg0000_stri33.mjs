import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const enter = async () => { await c.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); };
// 1. 点撰写新博文
const e = await c.eval(`(function(){
  const els=[...document.querySelectorAll('button, a, div[role=button]')].filter(el=>el.offsetParent && (el.textContent||'').trim()==='撰写新博文');
  if(!els.length) return null; const r=els[0].getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
if(!e){console.log('no btn');process.exit(1);}
const p=JSON.parse(e); await clickXY(p.x,p.y);
// 2. 等编辑器出现
let editor=false;
for(let i=0;i<10;i++){ await sleep(2000);
  const has = await c.eval(`document.body.innerText.includes('添加博客标题')`);
  if(has){editor=true;break;}
}
console.log('editor open:', editor);
if(!editor) process.exit(2);
// 3. 标题
await clickXY(700,202); await sleep(800);
await c.send('Input.insertText',{text:'开工第一篇：给自己一个安静的写字角落'});
await sleep(800);
// 4. 正文
await clickXY(700,434); await sleep(800);
const paras=['开了一个新博客，先说几句。','之前的东西散落在各个平台，找起来麻烦，索性在这里安个家。这里会很杂：工作里踩过的坑、看书看剧的零碎想法、还有日常里那些不值得单独成篇的小事。','不追热点，也不立什么更新flag。写出来，第一是给自己存档，第二是如果恰好有人搜索到了、读到了，能有点用处或者共鸣，那就是赚到的。','就这样，第一篇，算剪彩。'];
for(let i=0;i<paras.length;i++){
  await c.send('Input.insertText',{text:paras[i]});
  await sleep(450);
  if(i<paras.length-1){await enter();await sleep(350);}
}
await sleep(1200);
// 5. 验证标题进了
const t = await c.eval(`document.body.innerText.includes('开工第一篇')`);
console.log('title in:', t);
// 6. 点发布(左栏)
const pb = await c.eval(`(function(){
  const els=[...document.querySelectorAll('button, a, div[role=button]')].filter(el=>el.offsetParent && (el.textContent||'').trim().startsWith('发布'));
  if(!els.length) return null; const r=els[0].getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),txt:els[0].innerText.trim().slice(0,10)});
})()`);
console.log('publish btn:', pb);
if(pb){const q=JSON.parse(pb); await clickXY(q.x,q.y); await sleep(3000);}
const after = await c.eval(`document.body.innerText.slice(0,300)`);
console.log('after publish click:', after.slice(0,250));
process.exit(0);
