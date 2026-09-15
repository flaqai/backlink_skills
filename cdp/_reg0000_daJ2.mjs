// _reg0000_daJ2.mjs — DA Journal 编辑器打开 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
await c.send('Page.navigate', {url: 'https://www.deviantart.com/journal/post'});
await sleep(9000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250), inputs: [...document.querySelectorAll('input,textarea,[contenteditable=true]')].filter(e=>e.offsetParent).map(e=>({tag:e.tagName,type:e.type||'',ph:e.placeholder||'',ce:e.isContentEditable})).slice(0,8)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daJ.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
