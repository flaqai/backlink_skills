import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('leoxmseo2'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(2000);
console.log('URL:', await c.eval('location.href.slice(0,100)'));
console.log('TITLE:', await c.eval('document.title.slice(0,80)'));
console.log('BODY:', await c.eval('document.body ? document.body.innerText.replace(/\s+/g," ").slice(0,200) : "no-body"'));
