import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('dofollow.tools/submit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
console.log(await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button[role=combobox]')].map(b => {
  // 找 label: aria-labelledby 或前面的 label 元素
  let label = '';
  if (b.getAttribute('aria-labelledby')) { const l = document.getElementById(b.getAttribute('aria-labelledby')); label = l ? l.innerText.trim() : ''; }
  if (!label) { const prev = b.closest('div')?.parentElement?.querySelector('label'); label = prev ? prev.innerText.trim() : ''; }
  return { text: b.innerText.trim().slice(0,40), label, id: b.id || null, name: b.getAttribute('name') };
}), null, 1))()`));
