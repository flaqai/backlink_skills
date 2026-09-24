import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://blogger.ba/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 14; i++) {
  await sleep(2000);
  const u = await cdp.evalT(`location.href`, 5000);
  if (await cdp.evalT(`document.readyState`, 5000) === 'complete' && String(u).includes('blogger.ba')) break;
}
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('BODY:', await cdp.evalT(`document.body.innerText.slice(0,250)`, 6000));
console.log('LOGGEDIN:', await cdp.evalT(`String(!!document.querySelector('#wp-admin-bar-my-account'))`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
