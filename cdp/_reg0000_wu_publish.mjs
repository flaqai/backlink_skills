import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h5: step2 字段+Publish
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// topic 搜索
const sp = await c.evalT(`(function(){var e=document.querySelector('input[name=topic-search], #topic-search'); if(!e) return 'NO'; e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
if (sp !== 'NO') {
  const [sx, sy] = sp.split('|').map(Number);
  await sleep(350);
  await ev('mouseMoved', { x: sx, y: sy }); await sleep(120);
  await ev('mousePressed', { x: sx, y: sy, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x: sx, y: sy, button: 'left', clickCount: 1 }); await sleep(300);
  await c.send('Input.insertText', { text: 'personal' }); await sleep(2500);
  console.log('TOPIC_SUGG:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('[class*=topic] li, [class*=topic] div, [class*=suggestion], [class*=dropdown] *').forEach(function(e){ if(e.offsetParent===null) return; var t=(e.innerText||'').trim(); if(t && t.length>2 && t.length<40 && /personal/i.test(t)){ var b=e.getBoundingClientRect(); lines.push([e.tagName+'.'+e.className.toString().slice(0,20), t.slice(0,30), Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|')); } }); return lines.slice(0,4).join(' ; ')||'NO_SUGG';})()`, 8000));
}
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_topic.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
