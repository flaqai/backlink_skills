import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Page.navigate', { url: 'https://patch.com/new-york/new-york-city' });
await sleep(8000);
console.log('URL:', await c.evalT('location.href', 6000));
// 找邮件订阅表单
console.log('SUBS:', await c.evalT("JSON.stringify([...document.querySelectorAll('input[type=email],form')].map(function(f){return f.tagName+':'+(f.type||'')+(f.action?':act='+f.action.slice(0,60):'')+(f.id?':id='+f.id:'');}).slice(0,8))", 8000));
console.log('EMBTN:', await c.evalT("JSON.stringify([...document.querySelectorAll('a,button')].filter(e=>e.offsetParent&&/subscri|newsletter|sign.?up/i.test(e.innerText||'')).map(function(e){var b=e.getBoundingClientRect(); return (e.innerText||'').trim().slice(0,30)+' @'+Math.round(b.x+b.width/2)+','+Math.round(b.y+b.height/2);}).slice(0,8))", 8000));
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_town.png', Buffer.from(s.data,'base64'));
console.log('SHOT ok');
