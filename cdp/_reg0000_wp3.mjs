// _reg0000_wp3.mjs — 预发布面板Publish确认 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /post\.php\?post=36/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:1288, y:65});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:1288, y:65, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:1288, y:65, button:'left', clickCount:1});
await sleep(12000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250)}))()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(7000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_wp3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
