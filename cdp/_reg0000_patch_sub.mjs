import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await ev('mouseMoved',{x:774,y:320}); await sleep(150);
await ev('mousePressed',{x:774,y:320,button:'left',clickCount:1}); await sleep(100);
await ev('mouseReleased',{x:774,y:320,button:'left',clickCount:1});
await sleep(4000);
// 看模态结构
console.log('MODAL:', await c.evalT("JSON.stringify([...document.querySelectorAll('input')].filter(e=>e.offsetParent).map(function(e){var b=e.getBoundingClientRect(); return (e.placeholder||e.type)+' @'+Math.round(b.x+b.width/2)+','+Math.round(b.y+b.height/2);}).slice(0,8))", 8000));
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_sub_modal.png', Buffer.from(s.data,'base64'));
console.log('SHOT ok');
