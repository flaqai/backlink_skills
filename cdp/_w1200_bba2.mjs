import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://blogger.ba/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 12; i++) {
  await sleep(2000);
  if (await cdp.evalT(`document.readyState`, 6000) === 'complete') break;
}
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('LOGGEDIN_myaccount:', await cdp.evalT(`String(!!document.querySelector('#wp-admin-bar-my-account'))`, 6000));
console.log('LINKS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('a')].map(function(a){return a.textContent.trim()+'|'+a.href}).filter(function(s){return /sign|login|admin|dashboard|account|ured|izmjen|objav|new|nova/i.test(s)}).slice(0,15))`, 8000));
console.log('COOKIES:', await cdp.evalT(`document.cookie.split(';').length`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
