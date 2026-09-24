import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(dom));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
const btn = await c.eval(`(function(){ const b=document.querySelector('input[name=signup],input[type=submit],button[name=signup],#register_btn') || [...document.querySelectorAll('button,input')].find(x=>/sign\s*up|register|create/i.test((x.innerText||x.value||''))&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),v:(b.value||b.innerText||'').slice(0,25),ty:b.type}); })()`);
if(!btn){ console.log('NO_BTN'); process.exit(1); }
const p = JSON.parse(btn);
console.log('BTN', JSON.stringify(p));
for (const ty of ['mouseMoved','mousePressed','mouseReleased']) {
  const ev = { type: ty, x: p.x, y: p.y };
  if (ty !== 'mouseMoved') { ev.button = 'left'; ev.clickCount = 1; }
  await c.send('Input.dispatchMouseEvent', ev);
}
await sleep(12000);
const after = await c.eval(`(function(){ return JSON.stringify({url:location.href.slice(0,110), head:document.body.innerText.replace(/\s+/g,' ').slice(0,160)}); })()`);
console.log('AFTER:', after);
process.exit(0);
