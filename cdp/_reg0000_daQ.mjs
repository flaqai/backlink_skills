// _reg0000_daQ.mjs — 关弹层→Posts标签 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com\/leoxm26/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
// 关X
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:1310, y:52});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:1310, y:52, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:1310, y:52, button:'left', clickCount:1});
await sleep(1200);
// 点Posts
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:648, y:444});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:648, y:444, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:648, y:444, button:'left', clickCount:1});
await sleep(3000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,350)}))()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('POSTS:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daQ.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
