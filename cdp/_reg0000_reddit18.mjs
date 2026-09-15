// _reg0000_reddit18.mjs — 点发帖(当前位置) (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 用文本定位发帖按钮(可能穿shadow)
const r = await Promise.race([c.evalT(`(() => {
  const find = (root, depth) => {
    if (depth > 6) return null;
    for (const el of root.querySelectorAll('button,[role=button]')) {
      if (el.offsetParent && /^发帖$/.test((el.innerText||'').trim())) return el;
    }
    for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) { const f = find(el.shadowRoot, depth+1); if (f) return f; } }
    return null;
  };
  const b = find(document, 0);
  if (!b) return 'nobtn';
  b.scrollIntoView({block:'center'});
  const rc = b.getBoundingClientRect();
  return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('BTN:', r);
if (r && r !== 'TO' && r !== 'nobtn') {
  const {x,y} = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(7000);
  const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,130), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,200)}))()`, 10000), sleep(11000).then(()=>'TO')]);
  console.log('AFTER:', typeof st === 'string' ? st : 'TO');
  const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
  if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_final.jpg', Buffer.from(shot.data, 'base64'));
}
ws.close();
