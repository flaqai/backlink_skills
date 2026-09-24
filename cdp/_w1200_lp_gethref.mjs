import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://letterpad.app/posts' });
  await sleep(10000);
  console.log(await cdp.eval(`JSON.stringify([...document.querySelectorAll('a, button')].filter(e => /new post/i.test(e.innerText)).map(e => ({ tag: e.tagName, href: e.href || '', onclick: (e.getAttribute('onclick') || '').slice(0, 60) })))`));
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
