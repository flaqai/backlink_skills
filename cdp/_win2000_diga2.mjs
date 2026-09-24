// diga: 点Change category开树, dump叶子: node _win2000_diga2.mjs
import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const c1 = await cdp.eval(`(() => { const el = document.getElementById('toggleCategTree'); if (!el) return 'NOEL'; el.scrollIntoView({block:'center'}); el.click(); return 'CLICKED'; })()`);
console.log('toggle:', c1);
await sleep(2500);
const dump = await cdp.eval(`(() => {
  const box = document.getElementById('categtreebox');
  if (!box) return 'NOBOX';
  const links = [...box.querySelectorAll('a')];
  return JSON.stringify(links.slice(0, 50).map(a => ({t: a.textContent.trim().slice(0, 35), oc: (a.getAttribute('onclick')||'').slice(0, 50)})));
})()`);
console.log('TREE:', String(dump).slice(0, 2200));
process.exit(0);
