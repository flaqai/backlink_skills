import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
// 向导条 Finish 链接
console.log('LINKS:', await c.evalT(`JSON.stringify([...document.querySelectorAll('a')].map(function(a){return {t:(a.innerText||'').trim().slice(0,20), h:(a.getAttribute('href')||'').slice(0,50)}}).filter(function(v){return /finish|skip|not now/i.test(v.t+v.h)}).slice(0,6))`, 6000));
const fin = await c.evalT(`JSON.stringify((function(){var as=[...document.querySelectorAll('a')].filter(function(a){return /finish/i.test(a.innerText||'')}); if(!as.length) return null; var r=as[0].getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};})())`, 6000);
if (fin && fin !== 'null') {
  const F = JSON.parse(fin);
  await ev('mouseMoved', { x: F.x, y: F.y }); await sleep(150);
  await ev('mousePressed', { x: F.x, y: F.y, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x: F.x, y: F.y, button: 'left', clickCount: 1 });
  await sleep(4000);
}
console.log('URL:', await c.evalT('location.href', 8000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,8).join(' | ').slice(0,250)", 8000));
process.exit(0);
