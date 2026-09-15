// _reg0000_reddit13.mjs — 选择社区 u/leoxm_c (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/submit/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 点选择社区
const r = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button,[role=button],faceplate-dropdown-menu,*')].filter(e=>e.offsetParent && /选择社区/.test((e.innerText||'').trim()) && e.getBoundingClientRect().height < 60);
  const el = els[0]; if(!el) return null; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect();
  return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('COMM_BTN:', r);
if (r && r !== 'TO') {
  const p = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:p.x, y:p.y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:1});
  await sleep(2500);
}
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_comm.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
