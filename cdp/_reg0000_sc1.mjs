import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it signup: open subscribe page, expand email form, fill, screenshot
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(600); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.scoop.it/subscribe', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(8000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// click bypass link to reveal email form
const bp = await c.eval(`(function(){ const a=document.querySelector('.signup-bypass a.bypass'); if(!a) return null; const r=a.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),txt:(a.innerText||'').trim()}); })()`);
console.log('bypass:', bp);
if (bp) { const p=JSON.parse(bp); await clickXY(p.x,p.y); await sleep(3000); }
// check form visibility
const st = await c.eval(`(function(){ const f=document.querySelector('#subscriptionForm'); if(!f) return 'NO_FORM'; const vis=!!(f.offsetParent||f.getClientRects().length); const inputs=[...f.querySelectorAll('input')].map(i=>({n:i.name,t:i.type,v:(i.value||'').slice(0,20),vis:!!i.offsetParent})); return JSON.stringify({visible:vis, inputs:inputs.slice(0,12)}); })()`);
console.log('form:', st.slice(0, 800));
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_form.png', Buffer.from(shot.data,'base64'));
console.log('TABID='+tab.id);
process.exit(0);
