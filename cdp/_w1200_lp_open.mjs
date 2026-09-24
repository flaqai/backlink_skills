// win1200: letterpad dashboard探路
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://app.letterpad.app/posts' });
await sleep(11000);
const r = await cdp.eval("(() => JSON.stringify({url: location.href.slice(0,90), title: document.title.slice(0,45), head: document.body.innerText.slice(0,250)}))()");
console.log('LP:', r.slice(0, 350));
console.log('TABID:' + t.id);
