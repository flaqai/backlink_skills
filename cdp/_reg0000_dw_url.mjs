import { CDP } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
console.log('ENTRY:', await c.evalT(`(function(){var as=[...document.querySelectorAll('a')].filter(function(a){return /View the entry/.test(a.innerText||'')}); return as.length? as[0].href : 'NO';})()`, 8000));
process.exit(0);
