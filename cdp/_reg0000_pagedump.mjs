import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const dom = process.argv[2];
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(dom));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
await sleep(3000);
console.log('URL:', tab.url.slice(0,110));
const txt = await c.eval(`document.body.innerText.replace(/\s+/g,' ').slice(0,400)`).catch(e=>'ERR:'+e.message.slice(0,80));
console.log('TEXT:', txt);
const els = await c.eval(`JSON.stringify([...document.querySelectorAll('input,button,a[href*=signup],a[href*=register]')].map(i=>({t:i.tagName,ty:i.type,n:i.name,id:i.id,href:i.href?i.href.slice(0,60):undefined,vis:!!i.offsetParent})).slice(0,20))`).catch(e=>'ERR:'+e.message.slice(0,80));
console.log('ELS:', els);
const s = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000_page_'+dom.replace(/[^a-z]/g,'')+'.png', Buffer.from(s.data,'base64'));
ws.close(); process.exit(0);
