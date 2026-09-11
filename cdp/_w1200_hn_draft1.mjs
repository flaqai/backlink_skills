// _w1200_hn_draft1.mjs — win1200: 打开hackernoon draft转储编辑器状态
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  console.log('url:', await cdp.eval('location.href'));
  const st = await cdp.eval(`(() => {
    const inputs = [...document.querySelectorAll('input')].map(e => ({ t: e.type, ph: (e.placeholder || '').slice(0, 40), vis: e.offsetParent !== null, file: e.type === 'file' }));
    const btns = [...document.querySelectorAll('button')].map(b => (b.innerText || '').trim().slice(0, 40)).filter(Boolean);
    const ce = !!document.querySelector('[contenteditable=true]');
    const h1 = (document.querySelector('h1, textarea[placeholder*="Title"], input[placeholder*="Title"]') || {}).innerText || (document.querySelector('input[placeholder*="itle"]') || {}).value || '';
    return JSON.stringify({ title: document.title, h1, ce, inputs: inputs.slice(0, 12), btns: [...new Set(btns)].slice(0, 15), body: document.body.innerText.slice(0, 600) });
  })()`);
  console.log(st);
  await shot('hn_draft');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
