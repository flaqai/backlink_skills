// _reg0000_daE.mjs — DA DOB设值+Join提交 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const setr = await Promise.race([c.evalT(`(() => {
  const sels = [...document.querySelectorAll('select')].filter(s=>s.offsetParent);
  if (sels.length < 3) return 'few:'+sels.length;
  const setVal = (s, v) => { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; setter.call(s, v); s.dispatchEvent(new Event('change',{bubbles:true})); };
  setVal(sels[0], '6'); setVal(sels[1], '15'); setVal(sels[2], '1995');
  return JSON.stringify(sels.map(s=>s.value));
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('SET:', setr);
await sleep(800);
const b = await Promise.race([c.evalT(`(() => { const btns=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && /^join$/i.test(b.innerText.trim())); if(!btns.length) return 'nf'; const rc=btns[0].getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('JOIN_BTN:', b);
if (b && b.startsWith('{')) {
  const {x,y} = JSON.parse(b);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(6000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,90), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,280), iframes: [...document.querySelectorAll('iframe')].map(f=>f.src.slice(0,70)).slice(0,5)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da4.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
