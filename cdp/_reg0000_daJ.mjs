// _reg0000_daJ.mjs — DA topics坐标点击 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
for (const [x,y] of [[663,275],[854,275],[1024,275]]) {
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(900);
}
const sel = await Promise.race([c.evalT(`(() => JSON.stringify({txt: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,80)}))()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('MID:', sel);
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:682, y:705});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:682, y:705, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:682, y:705, button:'left', clickCount:1});
await sleep(7000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,110), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,300), iframes: [...document.querySelectorAll('iframe')].map(f=>f.src.slice(0,80)).slice(0,5)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da9.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
