// _reg0000_reddit15.mjs — 搜索框选u/leoxm_c社区 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/submit/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 点搜索框
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:684, y:194});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:684, y:194, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:684, y:194, button:'left', clickCount:1});
await sleep(1200);
await c.send('Input.insertText', {text: 'u/leoxm_c'});
await sleep(3000);
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_comm3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
