import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
// 先点ZIP清空之
await ev('mouseMoved',{x:681,y:334}); await sleep(150);
await ev('mousePressed',{x:681,y:334,button:'left',clickCount:3}); await sleep(100); // 三连击全选
await ev('mouseReleased',{x:681,y:334,button:'left',clickCount:3}); await sleep(300);
await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8}); await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8});
await sleep(300);
await c.send('Input.insertText',{text:'10001'}); await sleep(1200);
// Tab 到邮箱
await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9}); await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
await sleep(500);
await c.send('Input.insertText',{text:'patch@92ng.com'}); await sleep(800);
console.log('focus:', await c.eval("document.activeElement.placeholder || document.activeElement.tagName"));
// Enter提交
await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
await sleep(7000);
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ')", 8000));
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_kb.png', Buffer.from(s.data,'base64'));
console.log('SHOT ok');
