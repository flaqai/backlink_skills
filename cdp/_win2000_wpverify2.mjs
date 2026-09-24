import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/2026/09/02/generator-fuel-types-compared-propane-natural-gas-gasoline-and-solar/'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
await cdp.send('Runtime.enable');
await sleep(15000);
console.log(await cdp.eval(`(() => {
  const all = [...document.querySelectorAll('.entry-content a[href], article a[href], main a[href]')].map(a => a.href).slice(0, 20);
  const rawHas = document.documentElement.innerHTML.includes('generatorforhouse');
  const txt = document.querySelector('.entry-content, article')?.innerText.slice(0, 300);
  return JSON.stringify({ all, rawHas, txt }, null, 1);
})()`));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
