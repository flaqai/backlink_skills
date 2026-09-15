import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const reqs = [];
c.on(m => { if (m.method === 'Network.requestWillBeSent') reqs.push({u: m.params.request.url.slice(0,110), mth: m.params.request.method}); });
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// Next 按钮
const nb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Next'&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 6000);
if(!nb){ console.log('no Next btn'); process.exit(1); }
const p = JSON.parse(nb);
await clickXY(p.x, p.y);
await sleep(6000);
console.log('URL:', await c.evalT('location.href', 6000));
console.log('REQS:'); reqs.filter(r => !/\.(png|css|js|woff)/.test(r.u)).slice(-8).forEach(r => console.log(' ', r.mth, r.u));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ')", 6000));
// hcaptcha 挑战弹出?
const zones = await c.evalT(`JSON.stringify([...document.querySelectorAll('iframe')].map(function(f){var b=f.getBoundingClientRect(); return f.src.slice(0,50)+' @'+Math.round(b.x)+','+Math.round(b.y)+' '+Math.round(b.width)+'x'+Math.round(b.height);}))`, 6000);
console.log('IFRAMES:', zones);
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_next.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
