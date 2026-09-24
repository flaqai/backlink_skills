import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const key = (t,o) => c.send('Input.dispatchKeyEvent', o.type ? o : {type:t,...o});
const chord = async (ctrl, k, code, wk) => {
  if(ctrl) await key('d',{type:'keyDown',key:'Control',code:'ControlLeft',windowsVirtualKeyCode:17});
  await key('d',{type:'rawKeyDown',key:k,code:code,windowsVirtualKeyCode:wk});
  await key('u',{type:'keyUp',key:k,code:code,windowsVirtualKeyCode:wk});
  if(ctrl) await key('u',{type:'keyUp',key:'Control',code:'ControlLeft',windowsVirtualKeyCode:17});
};
const clearField = async (x,y) => {
  await clickXY(x,y); await sleep(600);
  await chord(true,'a','KeyA',65); await sleep(300);
  await key('d',{type:'rawKeyDown',key:'Delete',code:'Delete',windowsVirtualKeyCode:46});
  await key('u',{type:'keyUp',key:'Delete',code:'Delete',windowsVirtualKeyCode:46});
  await sleep(500);
};
const enter = async () => { await key('d',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); await key('u',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); };
// 1. 清标题
await clearField(700,202);
await c.send('Input.insertText',{text:'开工第一篇：给自己一个安静的写字角落'});
await sleep(800);
// 2. 清正文
await clearField(700,434);
const paras=['开了一个新博客，先说几句。','之前的东西散落在各个平台，找起来麻烦，索性在这里安个家。这里会很杂：工作里踩过的坑、看书看剧的零碎想法、还有日常里那些不值得单独成篇的小事。','不追热点，也不立什么更新flag。写出来，第一是给自己存档，第二是如果恰好有人搜索到了、读到了，能有点用处或者共鸣，那就是赚到的。','就这样，第一篇，算剪彩。'];
for(let i=0;i<paras.length;i++){
  await c.send('Input.insertText',{text:paras[i]});
  await sleep(450);
  if(i<paras.length-1){await enter();await sleep(350);}
}
await sleep(1500);
const t = await c.eval(`document.body.innerText.slice(0,400)`);
console.log('state:', t.slice(0,320));
process.exit(0);
