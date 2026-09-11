// _w1200_hn_probe.mjs — win1200: hackernoon cookie注入后探测登录态(drafts是否可达)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

const goto = async (url, ms = 12000) => {
  await cdp.send('Page.navigate', { url });
  await sleep(ms);
  return cdp.eval('location.href');
};

try {
  console.log('drafts:', await goto('https://app.hackernoon.com/drafts', 15000));
  const st = await cdp.eval(`(() => {
    const t = document.body ? document.body.innerText.slice(0, 400) : 'NOBODY';
    return JSON.stringify({ title: document.title, t });
  })()`);
  console.log('state:', st);
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
