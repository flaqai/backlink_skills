import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: finish onboarding (pick Technology + OK), then open PUBLISH menu
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// tick Technology checkbox
const tk = await c.evalT(`(function(){ const boxes=[...document.querySelectorAll('input[type=checkbox]')]; const b=boxes.find(x=>x.offsetParent); if(b&&!b.checked) b.click(); const ok=[...document.querySelectorAll('button, a')].find(x=>(x.innerText||'').trim()==='OK'&&x.offsetParent); if(!ok) return 'NO_OK'; const r=ok.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('onboard:', tk);
if(tk.startsWith('{')){ const p=JSON.parse(tk); await clickXY(p.x,p.y); await sleep(3000); }
// dump PUBLISH menu links
const pub = await c.evalT(`(function(){ const items=[...document.querySelectorAll('a')].filter(a=>/publish|create|topic|new/i.test((a.innerText||'')+' '+a.href)).map(a=>({t:(a.innerText||'').trim().slice(0,25),h:a.href.slice(0,80)})); return JSON.stringify(items.slice(0,10)); })()`, 10000);
console.log('publish links:', pub);
process.exit(0);
