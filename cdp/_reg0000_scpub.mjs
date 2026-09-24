import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: open PUBLISH dropdown, dump menu
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(2000);
const pub = await c.evalT(`(function(){ const el=[...document.querySelectorAll('a,button,li')].find(x=>(x.innerText||'').trim().startsWith('PUBLISH')&&x.offsetParent); if(!el) return 'NO_PUB'; el.click(); const r=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('publish:', pub);
if(pub.startsWith('{')){ const p=JSON.parse(pub);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
  await sleep(1500);
  const menu = await c.evalT(`(function(){ const items=[...document.querySelectorAll('a,.dropdown-menu li, .menu li')].filter(x=>x.offsetParent).map(x=>({t:(x.innerText||'').trim().slice(0,30),h:(x.href||'').slice(0,80)})).filter(x=>x.t); return JSON.stringify(items.slice(0,12)); })()`, 8000);
  console.log('menu:', menu);
}
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_pub.png', Buffer.from(shot.data,'base64'));
process.exit(0);
