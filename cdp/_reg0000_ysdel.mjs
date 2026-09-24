import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: delete ONE duplicate post (two identical "running notebook" posts on profile)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// find delete options on posts (WoWonder: post dropdown -> Delete Post)
const opts = await c.evalT(`(function(){ const menus=[...document.querySelectorAll('[class*=option], [class*=dropdown], [data-toggle]')].filter(x=>x.offsetParent&&/post/i.test(x.className+x.getAttribute('data-origin')||'')); const del=[...document.querySelectorAll('a,button,li')].filter(x=>/delete/i.test(x.innerText||'')&&x.offsetParent).map(x=>({t:(x.innerText||'').trim().slice(0,20),tag:x.tagName})); return JSON.stringify({menus:menus.length, del:del.slice(0,5)}); })()`, 10000);
console.log('delete candidates:', opts);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_del.png', Buffer.from(shot.data,'base64'));
process.exit(0);
