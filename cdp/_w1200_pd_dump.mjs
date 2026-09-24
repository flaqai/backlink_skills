import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
const r = await cdp.eval(`(() => {
  const inp = [...document.querySelectorAll('input,textarea,select')].map(i => ({t: i.tagName, n: i.name||'', ty: i.type||'', vis: !!i.offsetParent}));
  const forms = [...document.querySelectorAll('form')].map(f => ({a: f.action.slice(0,60), m: f.method, nf: f.elements.length}));
  return JSON.stringify({url: location.href.slice(0,90), inp: inp.slice(0,20), forms, head: document.body.innerText.slice(0,250)});
})()`);
console.log(r.slice(0, 1100));
