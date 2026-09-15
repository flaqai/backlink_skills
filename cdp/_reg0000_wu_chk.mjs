import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
if (!tab) { console.log('TAB_GONE'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.evalT('location.href', 8000));
console.log('IMG:', await c.evalT(`(function(){var img=document.querySelector('[class*=featured] img, img[src*=writeupcafe], img[src*=http]'); var all=[...document.querySelectorAll('img')].map(function(i){return (i.src||'').slice(0,55)}).filter(function(s){return !/logo|avatar|icon/.test(s)}); return all.slice(0,3).join(' ; ')||'none';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_img_done.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
