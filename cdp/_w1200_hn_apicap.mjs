// _w1200_hn_apicap.mjs — win1200: 抓hackernoon draft保存API(点Save时监听请求)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('Network.enable');
const reqs = [];
cdp.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method !== 'GET') {
    reqs.push({ url: m.params.request.url.slice(0, 140), method: m.params.request.method, post: (m.params.request.postData || '').slice(0, 500) });
  }
});

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 在描述字段打一个字触发autosave(或点Save)
  await cdp.eval(`(() => { const e = [...document.querySelectorAll('textarea')].find(x => /TL;DR|description/i.test(x.placeholder || '')); if (e) { e.focus(); } })()`);
  await cdp.send('Input.insertText', { text: '.' });
  await sleep(1500);
  // 点Save
  await cdp.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => /^save$/i.test(x.innerText.trim()) && x.offsetParent !== null); if (b) { b.scrollIntoView({ block: 'center' }); } })()`);
  const b = await cdp.eval(`(() => { const btn = [...document.querySelectorAll('button')].find(x => /^save$/i.test(x.innerText.trim()) && x.offsetParent !== null); if (!btn) return 'null'; const r = btn.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
  if (b !== 'null') {
    const B = JSON.parse(b);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: B.x, y: B.y });
    await sleep(120);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: B.x, y: B.y, button: 'left', clickCount: 1 });
  }
  await sleep(10000);
  console.log('captured:', JSON.stringify(reqs.slice(0, 6), null, 1));
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
