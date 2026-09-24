import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h2: settings 完善最小集
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

const fill = async (sel, text) => {
  const p = await c.evalT(`(function(){var e=document.querySelector('${sel}'); if(!e) return 'NO'; e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  if (p === 'NO') { console.log('MISS ' + sel); return; }
  const [x, y] = p.split('|').map(Number);
  await sleep(350);
  await ev('mouseMoved', { x, y }); await sleep(120);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 }); await sleep(250);
  await c.send('Input.insertText', { text }); await sleep(250);
};

await fill('input[name=display_name]', 'Leo Xm');
await fill('textarea[name=bio]', 'Bicycle mechanic and part-time writer. I note down small observations from everyday life.');
await fill('input[name=tagline]', 'Notes from an ordinary week');

// 时区 select 设值
await c.evalT(`(function(){var s=document.querySelector('select[name=timezone]'); if(s){ s.selectedIndex=0; s.dispatchEvent(new Event('change',{bubbles:true})); } return 'tz';})()`);
await sleep(300);

// 找 save/submit 按钮
console.log('BTNS:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('button[type=submit], input[type=submit]').forEach(function(b){ if(b.offsetParent===null) return; var r=b.getBoundingClientRect(); lines.push([(b.innerText||b.value||'').slice(0,25), Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|')); }); return lines.join(' ; ') || 'NONE';})()`, 8000));
const pos = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button, input[type=submit]')].filter(function(b){return b.offsetParent!==null && /save|update|save profile/i.test((b.innerText||b.value||''))}); if(!bs.length) return 'NO'; var b=bs[0]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2), (b.innerText||b.value).slice(0,20)].join('|');})()`, 8000);
console.log('SAVE:', pos);
if (pos !== 'NO') {
  const [x, y] = pos.split('|').map(Number);
  await sleep(400);
  await ev('mouseMoved', { x, y }); await sleep(150);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
console.log('URL:', await c.evalT('location.href', 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_settings.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
