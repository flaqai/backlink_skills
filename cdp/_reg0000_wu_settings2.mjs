import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h3: settings v2 (打字验证+city下拉)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

const clickCenter = async (sel) => {
  const p = await c.evalT(`(function(){var e=document.querySelector('${sel}'); if(!e) return 'NO'; e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  if (p === 'NO') return false;
  const [x, y] = p.split('|').map(Number);
  await sleep(350);
  await ev('mouseMoved', { x, y }); await sleep(120);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 }); await sleep(300);
  return true;
};
const typeField = async (sel, text, check) => {
  const ok = await clickCenter(sel);
  if (!ok) return 'NO_ELEM';
  await c.send('Input.insertText', { text }); await sleep(300);
  const v = await c.evalT(`(function(){var e=document.querySelector('${sel}'); return e? (e.value||'').slice(0,50) : 'NO';})()`, 6000);
  return check + '=' + v;
};

console.log(await typeField('input[name=display_name]', 'Leo Xm', 'dn'));
console.log(await typeField('textarea[name=bio]', 'Bicycle mechanic and part-time writer. I note down small observations from everyday life.', 'bio'));
console.log(await typeField('input[name=tagline]', 'Notes from an ordinary week', 'tag'));

// city: 打字触发建议
await clickCenter('input[name=city_search], #city-search-input, input.city-search') || await clickCenter('#city-search-input');
await c.send('Input.insertText', { text: 'Portland' });
await sleep(2500);
// dump 建议项
console.log('SUGG:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('[class*=suggestion],[class*=dropdown] li,[class*=autocomplete] li,ul li').forEach(function(e){ if(e.offsetParent===null) return; var t=(e.innerText||'').trim(); if(t && t.length<60 && /portland/i.test(t)) { var b=e.getBoundingClientRect(); lines.push([t.replace(String.fromCharCode(10),' / '), Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|')); } }); return lines.slice(0,4).join(' ; ') || 'NO_SUGG';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_city.png', Buffer.from(s.data, 'base64'));
console.log('VALS:', await c.evalT(`(function(){var d=document.querySelector('input[name=display_name]'); return 'dn='+(d?d.value:'?');})()`, 6000));
console.log('SHOT ok');
process.exit(0);
