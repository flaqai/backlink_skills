import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);
// 点 Portland, Oregon (坐标来自上一轮 rect, 但页面可能滚动了——重新按文本找)
const pos = await c.evalT(`(function(){var items=[...document.querySelectorAll('.city-ac-item')].filter(function(e){return e.offsetParent!==null && /Oregon/.test(e.innerText)}); if(!items.length) return 'NO'; var b=items[0].getBoundingClientRect(); return [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|');})()`, 8000);
console.log('ITEM:', pos);
if (pos !== 'NO') {
  const [x, y] = pos.split('|').map(Number);
  await ev('mouseMoved', { x, y }); await sleep(120);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 });
  await sleep(800);
}
console.log('CID:', await c.evalT(`(function(){var ci=document.getElementById('city_id_input'); var co=document.getElementById('country_input'); var cs=document.getElementById('city-search-input'); return 'city_id='+(ci&&ci.value)+' country='+(co&&co.value)+' shown='+(cs&&cs.value);})()`, 8000));
// Save Changes
const pos2 = await c.evalT(`(function(){var bs=[...document.querySelectorAll('button')].filter(function(b){return b.offsetParent!==null && /Save Changes/.test(b.innerText||'')}); if(!bs.length) return 'NO'; var b=bs[bs.length-1]; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
console.log('SAVE:', pos2);
if (pos2 !== 'NO') {
  const [x2, y2] = pos2.split('|').map(Number);
  await sleep(400);
  await ev('mouseMoved', { x: x2, y: y2 }); await sleep(150);
  await ev('mousePressed', { x: x2, y: y2, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x: x2, y: y2, button: 'left', clickCount: 1 });
  await sleep(5000);
}
console.log('URL:', await c.evalT('location.href', 8000));
console.log('MSG:', await c.evalT(`(function(){var m=document.querySelector('[class*=alert],[class*=success],[class*=error],[role=alert]'); return m? m.innerText.slice(0,120) : 'no_msg';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_saved.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
