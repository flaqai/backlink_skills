import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(150); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(100); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(600); };
const type = async (x,y,text) => { await click(x,y); await c.send('Input.insertText',{text}); await sleep(300); };
// 关I Accept
await click(1200,669);
await sleep(1000);
// 模态可能被关掉? 检查
const modal = await c.evalT("!!document.querySelector('input[placeholder=\"Email address\"]') && document.querySelector('input[placeholder=\"Email address\"]').offsetParent !== null", 5000);
console.log('modal still open:', modal);
if (modal === true) {
  await type(681,334,'10001');
  await type(681,404,'patch@92ng.com');
  console.log('vals:', await c.eval("JSON.stringify([...document.querySelectorAll('input')].filter(i=>i.offsetParent).map(i=>(i.placeholder||i.type)+'='+(i.value||'').slice(0,30)))"));
  await click(681,503); // Find your community
  await sleep(6000);
  console.log('URL:', await c.evalT('location.href', 6000));
  console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,14).join(' | ')", 8000));
  const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
  if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_after.png', Buffer.from(s.data,'base64'));
  console.log('SHOT ok');
} else {
  const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
  if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_after.png', Buffer.from(s.data,'base64'));
  console.log('modal gone, shot only');
}
