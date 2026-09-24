import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// postach step2: click Next, wait for captcha challenge, screenshot
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const nb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Next'&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
console.log('nextBtn:', nb);
if(!nb) process.exit(1);
const p=JSON.parse(nb); await clickXY(p.x,p.y);
await sleep(6000);
const st = await c.eval(`(function(){ const ifr=[...document.querySelectorAll('iframe')].map(x=>({src:(x.src||'').slice(0,60),x:Math.round(x.getBoundingClientRect().x),y:Math.round(x.getBoundingClientRect().y),w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})).filter(f=>f.w>50); return JSON.stringify({url:location.href.slice(0,90), iframes:ifr}); })()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_challenge.png', Buffer.from(shot.data,'base64'));
process.exit(0);
