import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(500); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.scoop.it/topic/leo-s-software-notebook', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await sleep(9000);
const st = await c.evalT(`(function(){ const a=[...document.querySelectorAll('a')].map(x=>x.href).filter(h=>/\\/p\\/\\d+/.test(h)); return JSON.stringify({title:document.title.slice(0,40), posts:[...new Set(a)].slice(0,4)}); })()`, 10000);
console.log(st);
process.exit(0);
