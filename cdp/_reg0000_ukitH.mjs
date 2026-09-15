// _reg0000_ukitH.mjs — ukit 滚顶+点Publish+截弹层 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await c.evalT(`window.scrollTo(0,0); (()=>{const el=document.scrollingElement||document.documentElement; if(el) el.scrollTop=0; document.querySelectorAll('*').forEach(e=>{if(e.scrollTop>0&&e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!=='visible')e.scrollTop=0;});})()`, 8000);
await sleep(1000);
const pos = await c.evalT(`(() => {
  const el = document.querySelector('.ul-button-yellow.js-preview-publish') || [...document.querySelectorAll('span')].find(e=>/js-preview-publish/.test(e.className) && /publish/i.test(e.innerText));
  if (!el) return 'notfound';
  el.scrollIntoView({block:'center'});
  const b = el.getBoundingClientRect();
  return JSON.stringify({x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2)});
})()`, 9000);
console.log('POS:', pos);
if (pos !== 'notfound') {
  const {x, y} = JSON.parse(pos);
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(4000);
  const dlg = await c.evalT(`(() => JSON.stringify({url:location.href.slice(0,100), modal:document.body.innerText.replace(/\s+/g,' ').slice(0,400)}))()`, 10000);
  console.log('AFTER:', typeof dlg === 'string' ? dlg : 'TIMEOUT');
  const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
  (await import('fs')).writeFileSync('_reg0000_ukit_publish.jpg', Buffer.from(shot.data, 'base64'));
}
ws.close();
