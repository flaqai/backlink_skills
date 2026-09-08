import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('topsimilarsites') && t.type === 'page');
if (!tab) { console.log('no tab'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const dump = await cdp.eval(`(() => {
  const out = [];
  document.querySelectorAll('a,button,input[type=submit]').forEach(el => {
    const t = (el.textContent||el.value||'').trim();
    if (t.toLowerCase().indexOf('add') >= 0 || el.getAttribute('onclick')) {
      const r = el.getBoundingClientRect();
      out.push({tag: el.tagName, text: t.slice(0,30), id: el.id, onclick: (el.getAttribute('onclick')||'').slice(0,80), href: (el.getAttribute('href')||'').slice(0,40), rect: {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)}});
    }
  });
  const form = document.querySelector('form');
  return JSON.stringify({forms: form ? {action: form.action, method: form.method, len: form.elements.length} : null, els: out.slice(0,8)}, null, 1);
})()`);
console.log(dump);
process.exit(0);
