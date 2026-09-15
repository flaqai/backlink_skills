import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.goto('https://diligent-lion-12gw4lx.mystrikingly.com/', 40000).catch(e=>console.log('goto:',e.message));
await sleep(8000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,90), title:document.title, hasPost:document.body.innerText.includes('开工第一篇'), text:document.body.innerText.slice(0,300)});
})()`);
console.log(st.slice(0,600));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-livebrowser.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
