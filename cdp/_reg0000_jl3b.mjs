import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
const link = await c.evalT(`(function(){ const a=[...document.querySelectorAll('a')].find(x=>/view your scoop/i.test(x.innerText||'')); return a?a.href:'NO_LINK'; })()`, 8000);
console.log(link);
process.exit(0);
