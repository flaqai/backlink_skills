import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
// 找 Finish/下一步 按钮 (跳到最后一页或直接提交)
console.log('BTNS:', await c.evalT(`JSON.stringify([...document.querySelectorAll('button,input[type=submit]')].map(function(b){var r=b.getBoundingClientRect(); return {v:(b.innerText||b.value||'').slice(0,25), x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)}}).filter(function(v){return v.v}))`, 6000));
// 直接点 Finish (表单最后一键)
const fin = await c.evalT(`JSON.stringify((function(){var bs=[...document.querySelectorAll('button,input[type=submit]')].filter(function(b){return /Finish/i.test(b.innerText||b.value||'')}); if(!bs.length) return null; var r=bs[0].getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)};})())`, 6000);
console.log('FIN:', fin);
if (fin && fin !== 'null') {
  const F = JSON.parse(fin);
  await F && ev('mouseMoved', { x: F.x, y: F.y }); await sleep(150);
  await ev('mousePressed', { x: F.x, y: F.y, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x: F.x, y: F.y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
console.log('URL:', await c.evalT('location.href', 8000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,300)", 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_finish.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
