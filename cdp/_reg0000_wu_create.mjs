import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h: writeupcafe 发文路径侦察
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// 找 Create 链接
console.log('CREATE:', await c.evalT(`(function(){var as=[...document.querySelectorAll('a')].filter(function(a){return a.innerText.trim()==='Create'||/create/.test(a.href||'')}); return as.slice(0,3).map(function(a){return a.href}).join(' ; ')||'NONE';})()`, 8000));
// 直接导航常见路径试探
await c.send('Page.navigate', { url: 'https://writeupcafe.com/writeups/create' });
await sleep(5000);
console.log('URL1:', await c.evalT('location.href', 8000));
console.log('FORM:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('input,textarea,select,button').forEach(function(e){ if(e.offsetParent===null) return; var b=e.getBoundingClientRect(); lines.push([e.tagName,(e.name||e.id||e.type||'').toString().slice(0,25),(e.placeholder||e.innerText||'').trim().slice(0,20),Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)].join('|')); }); return lines.join(' ; ').slice(0,900) || 'EMPTY';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_create.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
