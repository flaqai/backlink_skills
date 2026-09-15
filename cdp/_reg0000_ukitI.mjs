// _reg0000_ukitI.mjs — ukit 点侧栏publish图标 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
// 先试JS click顶部Publish
const js = await c.evalT(`(() => { const el=document.querySelector('.ul-button-yellow.js-preview-publish'); if(el){el.click(); return 'js-clicked';} return 'no'; })()`, 8000);
console.log('JS:', js);
await sleep(3500);
let dlg = await c.evalT(`(() => JSON.stringify({txt:document.body.innerText.replace(/\s+/g,' ').slice(0,300)}))()`, 9000);
console.log('A1:', typeof dlg === 'string' ? dlg.slice(0,250) : 'TO');
// 无弹层则点侧栏图标(真实鼠标)
const hasModal = await c.evalT(`(() => !!document.querySelector('.ul-button-yellow.js-preview-publish') && /publish site|are you sure|confirm/i.test(document.body.innerText) ? 'modal' : 'none')()`, 8000);
console.log('MODAL:', hasModal);
if (hasModal === 'none') {
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:24, y:781, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:24, y:781, button:'left', clickCount:1});
  await sleep(3500);
  dlg = await c.evalT(`(() => JSON.stringify({txt:document.body.innerText.replace(/\s+/g,' ').slice(0,400)}))()`, 10000);
  console.log('A2:', typeof dlg === 'string' ? dlg.slice(0,350) : 'TO');
}
const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
(await import('fs')).writeFileSync('_reg0000_ukit_pub2.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
