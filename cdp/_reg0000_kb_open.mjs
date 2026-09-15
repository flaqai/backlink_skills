import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000f: kidblog register SPA 侦察
const mk = await fetch('http://127.0.0.1:9224/json/new?https://kidblog.org/home/register/', { method: 'PUT' }).then(r => r.json());
await sleep(1500);
await fetch(`http://127.0.0.1:9224/json/activate/${mk.id}`).catch(() => {});
await sleep(6000);
const ws = new WebSocket(mk.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.evalT('location.href', 8000));
console.log('TEXT:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,15).join(' | ').slice(0,400)`, 8000));
console.log('INPUTS:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('input,button,select').forEach(function(e){ if(e.offsetParent===null) return; var b=e.getBoundingClientRect(); lines.push([e.tagName,(e.type||''),(e.placeholder||e.innerText||'').trim().slice(0,25),Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)].join('|')); }); return lines.join(' ; ').slice(0,800);})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/kb_page.png', Buffer.from(s.data, 'base64'));
console.log('tab=' + mk.id + ' SHOT ok');
process.exit(0);
