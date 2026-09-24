// _reg0000_daF.mjs — DA intent问卷 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const r = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button,[role=radio],label,div')].filter(e=>e.offsetParent && /join the community/i.test((e.innerText||'').trim()) && e.getBoundingClientRect().height < 80 && e.getBoundingClientRect().height > 20);
  const el=els[0]; if(!el) return 'nf'; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect();
  return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('OPT:', r);
if (r && r.startsWith('{')) {
  const {x,y} = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(1200);
}
const c2 = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button')].filter(e=>e.offsetParent && /^continue$/i.test((e.innerText||'').trim()));
  if(!els.length) return 'nf'; const rc=els[0].getBoundingClientRect();
  return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('CONT:', c2);
if (c2 && c2.startsWith('{')) {
  const {x,y} = JSON.parse(c2);
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(6000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,300), iframes: [...document.querySelectorAll('iframe')].map(f=>f.src.slice(0,70)).slice(0,5)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da5.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
