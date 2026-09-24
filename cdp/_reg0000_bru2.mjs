import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogerus.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const st = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button,input,div[role=button],a')].filter(x=>x.offsetParent&&/verify|check|submit|next/i.test(((x.innerText||x.value||'')).trim())).map(x=>{const r=x.getBoundingClientRect(); return {txt:(x.innerText||x.value||'').trim().slice(0,20),tag:x.tagName,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};}); const task=(document.body.innerText.match(/Select all images with ([^.]+)/)||[])[1]; return JSON.stringify({task, buttons:b.slice(0,6), url:location.href.slice(0,70)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/bru_state.png', Buffer.from(shot.data,'base64'));
process.exit(0);
