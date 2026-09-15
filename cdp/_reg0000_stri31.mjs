import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const enter = async () => {
  await c.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
};
await clickXY(700,202);
await sleep(800);
await c.send('Input.insertText', { text: '开工第一篇：给自己一个安静的写字角落' });
await sleep(800);
await clickXY(700,434);
await sleep(800);
const paras = [
  '开了一个新博客，先说几句。',
  '之前的东西散落在各个平台，找起来麻烦，索性在这里安个家。这里会很杂：工作里踩过的坑、看书看剧的零碎想法、还有日常里那些不值得单独成篇的小事。',
  '不追热点，也不立什么更新flag。写出来，第一是给自己存档，第二是如果恰好有人搜索到了、读到了，能有点用处或者共鸣，那就是赚到的。',
  '就这样，第一篇，算剪彩。'
];
for (let i=0;i<paras.length;i++){
  await c.send('Input.insertText', { text: paras[i] });
  await sleep(500);
  if (i<paras.length-1) { await enter(); await sleep(400); }
}
await sleep(1500);
const check = await c.eval(`(function(){
  const ces=[...document.querySelectorAll('.public-DraftEditor-content')];
  return ces.map(e=>e.textContent.slice(0,40)).join(' || ').slice(0,300);
})()`);
console.log('content:', check);
process.exit(0);
