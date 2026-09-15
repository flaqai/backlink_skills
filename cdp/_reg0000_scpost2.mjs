import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.evalT(`(function(){ window.scrollTo(0, document.body.scrollHeight); return document.body.scrollHeight; })()`, 8000);
await sleep(1500);
const pb = await c.evalT(`(function(){ const cands=[...document.querySelectorAll('button,input[type=submit],a,[role=button]')].filter(x=>x.offsetParent&&/publish|save|scoop/i.test(((x.innerText||'')+(x.value||'')).trim())); return JSON.stringify(cands.map(x=>{const r=x.getBoundingClientRect(); return {txt:((x.innerText||x.value||'')).trim().slice(0,30),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})); })()`, 10000);
console.log('candidates:', pb);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_bottom.png', Buffer.from(shot.data,'base64'));
process.exit(0);
