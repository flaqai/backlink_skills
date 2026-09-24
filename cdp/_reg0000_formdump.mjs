import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(dom));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
console.log('URL:', tab.url.slice(0, 100));
const r = await c.eval(`JSON.stringify([...document.querySelectorAll('input,button')].map(i=>({tag:i.tagName,type:i.type,name:i.name,id:i.id,ph:i.placeholder,vis:!!i.offsetParent})).filter(x=>x.vis).slice(0,25))`).catch(e=>'ERR:'+e.message);
console.log('FIELDS:', r);
process.exit(0);
