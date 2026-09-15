// _reg0000_reddit14.mjs — 坐标点击社区选择器+打字筛选 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/submit/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:222, y:92});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:222, y:92, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:222, y:92, button:'left', clickCount:1});
await sleep(2500);
// 找弹出的搜索input(可能在shadow DOM)并打字
const inp = await Promise.race([c.evalT(`(() => {
  const find = (root, depth) => {
    if (depth > 6) return null;
    for (const el of root.querySelectorAll('input,[contenteditable=true]')) {
      const r = el.getBoundingClientRect();
      if (r.width > 100 && r.height > 10) return el;
    }
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) { const f = find(el.shadowRoot, depth+1); if (f) return f; }
    }
    return null;
  };
  const el = find(document, 0);
  if (!el) return 'noinput';
  el.focus();
  return 'focused:' + el.tagName;
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('INPUT:', inp);
if (inp && inp.startsWith('focused')) {
  await c.send('Input.insertText', {text: 'u/leoxm_c'});
  await sleep(2500);
}
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_comm2.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
