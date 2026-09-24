import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
console.log('BTNS:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('button, a[class*=btn]').forEach(function(b){ if(b.offsetParent===null) return; var t=(b.innerText||'').trim(); if(t) { var r=b.getBoundingClientRect(); lines.push([t.slice(0,18), Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|')); } }); return lines.join(' ; ').slice(0,500) || 'NONE';})()`, 8000));
const pos = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button, a')].filter(function(b){return b.offsetParent!==null && /^Next/.test((b.innerText||'').trim())}); if(!bs.length) return 'NO'; var b=bs[0]; var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
console.log('NEXT:', pos);
if (pos !== 'NO') {
  const [x, y] = pos.split('|').map(Number);
  await ev('mouseMoved', { x, y }); await sleep(150);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
  await sleep(4000);
  console.log('URL:', await c.evalT('location.href', 8000));
  console.log('FORM:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('input:not([type=hidden]),textarea,select,button').forEach(function(e){ if(e.offsetParent===null) return; var b=e.getBoundingClientRect(); lines.push([e.tagName,(e.name||e.id||e.type||'').toString().slice(0,22),(e.placeholder||e.innerText||'').trim().slice(0,18),Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)].join('|')); }); return lines.join(' ; ').slice(0,900) || 'EMPTY';})()`, 8000));
}
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_next2.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
