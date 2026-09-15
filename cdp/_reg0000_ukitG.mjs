// _reg0000_ukitG.mjs — ukit 退出编辑+找Publish (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
await c.send('Input.dispatchKeyEvent', {type:'keyUp', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
await sleep(1500);
// 找Publish按钮
const pub = await c.evalT(`(() => {
  const els = [...document.querySelectorAll('button,a,[class*=publish],[class*=Publish],div[role=button]')].filter(el=>el.offsetWidth && /publish/i.test(el.innerText+el.className)).slice(0,8).map(el=>({tag:el.tagName, txt:el.innerText.trim().slice(0,20), cls:el.className.toString().slice(0,50), r:(()=>{const b=el.getBoundingClientRect();return [Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)]})()}));
  return JSON.stringify(els);
})()`, 10000);
console.log('PUBLISH:', pub);
ws.close();
