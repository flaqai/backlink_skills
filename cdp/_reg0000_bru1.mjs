import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// blogerus: click boat tiles + VERIFY + submit signup
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogerus.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const TILES = JSON.parse(process.argv[2] || '[]');
for (const [x,y] of TILES){ await clickXY(x,y); await sleep(500); }
// VERIFY button
const vb = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button,input,div[role=button]')].find(x=>(x.innerText||x.value||'').trim().toUpperCase()==='VERIFY'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('verify:', vb);
if(!vb) process.exit(1);
const vp=JSON.parse(vb); await clickXY(vp.x, vp.y);
await sleep(5000);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/bru_after.png', Buffer.from(shot.data,'base64'));
process.exit(0);
