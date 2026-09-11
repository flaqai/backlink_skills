import { CDP, sleep } from './CDP.mjs';
// win1200: dump登录表单结构
const url = process.argv[2];
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + url, { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await sleep(9000);
const st = await cdp.eval(`JSON.stringify({
  url: location.href.slice(0,110),
  inputs: [...document.querySelectorAll('input,button[type=submit],input[type=submit]')].map(i => ({tag: i.tagName, n: i.name, id: i.id, t: i.type, ph: (i.placeholder||'').slice(0,30), vis: !!i.offsetParent})).slice(0,15),
  forms: [...document.querySelectorAll('form')].map(f => ({action: (f.action||'').slice(0,80), method: f.method, ids: [...f.querySelectorAll('input')].map(i => i.name || i.id).slice(0,8)})).slice(0,4),
  iframes: [...document.querySelectorAll('iframe')].map(f => (f.src||'').slice(0,80)).slice(0,4),
  bodyTxt: (document.querySelector('body')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,250)
})`);
console.log(st);
await fetch('http://127.0.0.1:9224/json/close/' + t.id).catch(() => {});
process.exit(0);
