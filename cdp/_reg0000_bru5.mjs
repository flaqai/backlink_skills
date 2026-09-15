import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// blogerus: click CF turnstile checkbox by screenshot coords, wait, check state
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogerus.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(255, 313);
await sleep(10000);
const st = await c.evalT(`(function(){ const cf=document.body.innerText.includes('安全验证'); return JSON.stringify({url:location.href.slice(0,80), cfStill:cf, body:(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean).slice(0,6).join('|').slice(0,200)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/bru_cf2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
