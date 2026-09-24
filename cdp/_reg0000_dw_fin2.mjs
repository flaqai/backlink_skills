import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
for (let round = 0; round < 4; round++) {
  const fin = await c.evalT(`JSON.stringify((function(){var bs=[...document.querySelectorAll('button,input[type=submit]')].filter(function(b){return /Save and Continue|Finish|Skip this/i.test(b.innerText||b.value||'')}); if(!bs.length) return null; var r=bs[0].getBoundingClientRect(); bs[0].scrollIntoView({block:'center'}); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), v:(bs[0].innerText||bs[0].value||'').slice(0,25)};})())`, 8000);
  if (!fin || fin === 'null') { console.log('NO_BTN'); break; }
  const F = JSON.parse(fin);
  await sleep(600);
  await ev('mouseMoved', { x: F.x, y: F.y }); await sleep(150);
  await ev('mousePressed', { x: F.x, y: F.y, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x: F.x, y: F.y, button: 'left', clickCount: 1 });
  await sleep(4000);
  console.log('R' + round, await c.evalT('location.href', 6000));
  if (/\/create\/done|\/manage|\/inbox|logout/.test(await c.evalT('location.href', 5000))) break;
}
console.log('FINAL URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,8).join(' | ').slice(0,250)", 8000));
process.exit(0);
