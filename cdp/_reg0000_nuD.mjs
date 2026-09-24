// _reg0000_nuD.mjs — inube 补格3+验证 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /inube\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(500);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
for (const [x,y] of [[828,320]]) {
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(700);
}
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:797, y:698, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:797, y:698, button:'left', clickCount:1});
await sleep(6000);
const tk = await Promise.race([c.evalT(`(() => { var t=document.getElementById('g-recaptcha-response'); return t && t.value ? 'HAS_TOKEN' : 'NO_TOKEN'; })()`, 7000), sleep(8000).then(()=>'TO')]);
console.log('TOKEN:', tk);
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:60}), sleep(7000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_nu_r3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
