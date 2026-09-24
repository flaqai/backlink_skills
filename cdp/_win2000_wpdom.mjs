import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('leoxmseo2.wordpress.com/wp-admin/post-new.php'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
console.log(await cdp.eval(`(() => {
  const ifr = [...document.querySelectorAll('iframe')].map(f => f.name + '|' + f.className + '|' + (f.src||'').slice(0,60));
  const editables = [...document.querySelectorAll('[contenteditable=true]')].map(e => (e.tagName) + ':' + (e.className||'').toString().slice(0,60) + ':text=' + (e.innerText||'').slice(0,30));
  const cms = [...document.querySelectorAll('.cm-content, [contenteditable]')].length;
  return JSON.stringify({ ifr, editables, cms }, null, 1);
})()`));
