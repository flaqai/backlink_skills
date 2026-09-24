import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: clear name, refill, submit topic
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// native setter clear+set (avoids cursor position issues)
const setv = await c.evalT(`(function(){ const i=document.querySelector('#name'); const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'); d.set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true})); d.set.call(i,"Leo's Software Notebook"); i.dispatchEvent(new Event('input',{bubbles:true})); return i.value; })()`, 10000);
console.log('name set:', setv);
const vis = await c.evalT(`(function(){ const r=[...document.querySelectorAll('input[name=visibility]')].find(x=>x.value==='public'); if(r&&!r.checked){ r.click(); r.dispatchEvent(new Event('change',{bubbles:true})); } const checked=[...document.querySelectorAll('input[name=visibility]')].find(x=>x.checked); return checked?checked.value:'none'; })()`, 8000);
console.log('visibility:', vis);
const btn = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').includes('Create a Topic')&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('btn:', btn);
if(!btn) process.exit(1);
const p=JSON.parse(btn); await clickXY(p.x,p.y);
await sleep(8000);
const st = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,110), title:document.title.slice(0,60)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_topic2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
