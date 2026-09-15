import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// writeablog.net: check terms, click SIGN UP, capture result
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('writeablog.net'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// tick the terms checkbox natively + visually
const tk = await c.eval(`(function(){ const b=document.querySelector('#checkbox_terms'); if(!b) return 'NO_CB'; b.scrollIntoView({block:'center'}); if(!b.checked){ b.click(); } const r=b.getBoundingClientRect(); return JSON.stringify({checked:b.checked,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
console.log('terms:', tk);
await sleep(500);
// click SIGN UP
const btn = await c.eval(`(function(){ const b=document.querySelector('#btn-signup'); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
console.log('btn:', btn);
if(!btn) process.exit(1);
const p=JSON.parse(btn); await clickXY(p.x,p.y);
await sleep(6000);
const st = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,100), body:(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean).slice(0,12).join('|').slice(0,400)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/wa_after.png', Buffer.from(shot.data,'base64'));
process.exit(0);
