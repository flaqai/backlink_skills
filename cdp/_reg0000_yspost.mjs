import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: open home feed, find post composer, fill, submit
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(500); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://youslade.com/home', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const st = await c.evalT(`(function(){ const ta=[...document.querySelectorAll('textarea')].filter(x=>x.offsetParent).map(x=>({id:x.id,name:x.name,ph:(x.placeholder||'').slice(0,40)})); const body=(document.body.innerText||''); return JSON.stringify({url:location.href.slice(0,80), loggedIn: body.includes('Leoxm26y')||body.includes('leoxm26y'), textareas:ta.slice(0,5)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_home.png', Buffer.from(shot.data,'base64'));
console.log('TABID='+tab.id);
process.exit(0);
