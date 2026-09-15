import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
// DOM清空ZIP
console.log('clear:', await c.evalT("(function(){ var i=document.querySelectorAll('input[placeholder=\"Your town or ZIP code\"]'); var n=0; i.forEach(function(el){ var st=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; st.call(el,''); el.dispatchEvent(new Event('input',{bubbles:true})); n++; }); return 'cleared '+n; })()", 5000));
const ev2 = async (x,y,text) => {
  await ev('mouseMoved',{x,y}); await sleep(150);
  await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(100);
  await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(400);
  await c.send('Input.insertText',{text}); await sleep(300);
};
await ev2(681,334,'10001');
await ev2(681,404,'patch@92ng.com');
console.log('vals:', await c.eval("JSON.stringify([...document.querySelectorAll('input')].filter(i=>i.offsetParent&&i.value).map(i=>(i.placeholder||i.type)+'='+(i.value||'').slice(0,40)))"));
await ev('mouseMoved',{x:681,y:503}); await sleep(150);
await ev('mousePressed',{x:681,y:503,button:'left',clickCount:1}); await sleep(100);
await ev('mouseReleased',{x:681,y:503,button:'left',clickCount:1});
await sleep(7000);
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,14).join(' | ')", 8000));
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_sub2.png', Buffer.from(s.data,'base64'));
console.log('SHOT ok');
