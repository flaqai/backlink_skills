// _reg0000_daS.mjs — 点JOURNAL按钮 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const r = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button,a')].filter(e=>e.offsetParent && /^journal$/i.test((e.innerText||'').trim()));
  if(!els.length) return 'nf';
  const el=els[els.length-1]; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect();
  return JSON.stringify({txt:el.innerText.trim(), x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('JBTN:', r);
if (r && r.startsWith('{')) {
  const {x,y} = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(8000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,110), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250), ed: [...document.querySelectorAll('[contenteditable=true],textarea')].filter(e=>e.offsetParent).map(e=>({tag:e.tagName,ce:e.isContentEditable,aid:e.getAttribute('aria-label')||'',ph:e.placeholder||''})).slice(0,6)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daS.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
