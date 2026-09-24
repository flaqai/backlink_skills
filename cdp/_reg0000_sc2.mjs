import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it signup v2: poll for page readiness, expand email form, fill
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// poll up to 20s for bypass link or form
let ready = null;
for (let i = 0; i < 10; i++) {
  ready = await c.evalT(`(function(){ const a=document.querySelector('.signup-bypass a.bypass'); const f=document.querySelector('#subscriptionForm'); return JSON.stringify({bypass: a?{txt:(a.innerText||'').trim(), x:Math.round(a.getBoundingClientRect().x+a.getBoundingClientRect().width/2), y:Math.round(a.getBoundingClientRect().y+a.getBoundingClientRect().height/2)}:null, form: f?!!(f.offsetParent||f.getClientRects().length):false, popup: !!document.querySelector('.popup-content.signup')}); })()`, 6000);
  if (ready !== 'TIMEOUT' && ready !== 'ERR:' && !/null/.test(ready)) { const o=JSON.parse(ready); if(o.bypass||o.form) break; }
  await sleep(2000);
}
console.log('ready:', ready);
process.exit(0);
