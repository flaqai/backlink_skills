import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// blogerus: click VERIFY by screenshot coords, then submit signup
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogerus.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(863, 624);
await sleep(6000);
// check captcha gone + click Sign Up Free
const st = await c.evalT(`(function(){ const gone=!document.querySelector('#captcha_window')||!document.querySelector('#captcha_window').offsetParent; const b=[...document.querySelectorAll('button,input[type=submit],a')].find(x=>/sign.?up.?free/i.test((x.innerText||x.value||'').trim())&&x.offsetParent); let btn=null; if(b){ b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); btn={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}; } return JSON.stringify({captchaGone:gone, signupBtn:btn}); })()`, 10000);
console.log(st);
const s1=JSON.parse(st);
if (s1.signupBtn){ await clickXY(s1.signupBtn.x, s1.signupBtn.y); await sleep(8000); }
const st2 = await c.evalT(`(function(){ const errs=[...document.querySelectorAll('.error,[class*=error]')].filter(x=>x.offsetParent&&x.innerText.trim()).map(x=>x.innerText.trim().slice(0,80)); return JSON.stringify({url:location.href.slice(0,80), errs, body:(document.body.innerText||'').split('\\n').map(s=>s.trim()).filter(Boolean).slice(0,8).join('|').slice(0,250)}); })()`, 10000);
console.log(st2);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/bru_final.png', Buffer.from(shot.data,'base64'));
process.exit(0);
