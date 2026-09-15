import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(150); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(100); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(600); };
// 选5格
for (const [x,y] of [[615,400],[712,400],[615,496],[712,496],[615,592]]) await click(x,y);
const shot1 = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot1) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_sel.png', Buffer.from(shot1.data,'base64'));
// 验证按钮 (794,679)
await click(794,679);
await sleep(4000);
console.log('TOKEN:', await c.evalT("[document.getElementById('g-recaptcha-response')].map(function(e){return e&&e.value?'HAS('+e.value.length+')':'NONE';}).join(',')", 6000));
const t0 = Date.now();
// 10秒内点 Join
const jb = await c.evalT("(function(){ const b=[...document.querySelectorAll('input[type=submit],button')].find(function(i){return (i.value||'').indexOf('Join')>=0||(i.innerText||'').indexOf('Join')>=0;}); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),dis:b.disabled}); })()", 6000);
console.log('joinBtn:', jb, 'delay:', Date.now()-t0, 'ms');
if (jb) { const p = JSON.parse(jb); if (!p.dis) await click(p.x,p.y); }
await sleep(6000);
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ')", 8000));
const shot2 = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot2) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_result.png', Buffer.from(shot2.data,'base64'));
console.log('SHOT ok');
