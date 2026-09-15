import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: click composer, type, submit post
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// click composer placeholder bar
await clickXY(489, 530);
await sleep(2500);
// find active editor (textarea or contenteditable expanded)
const ed = await c.evalT(`(function(){ const ta=[...document.querySelectorAll('textarea,[contenteditable=true]')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,id:x.id||'',cls:(x.className||'').slice(0,30)})); return JSON.stringify(ta.slice(0,6)); })()`, 8000);
console.log('editors:', ed);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_editor.png', Buffer.from(shot.data,'base64'));
process.exit(0);
