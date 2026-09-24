// _w1200_sv_recon.mjs — win1200: svbtle /write 编辑器侦察
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
  await cdp.send('Page.navigate', { url: 'https://svbtle.com/write' });
  await sleep(12000);
  const st = await cdp.eval(`JSON.stringify({
    url: location.href,
    inputs: [...document.querySelectorAll('input, textarea')].filter(e => e.offsetParent !== null).map(e => ({ t: e.type || e.tagName, ph: (e.placeholder || '').slice(0, 40), n: e.name, id: e.id })),
    ce: [...document.querySelectorAll('[contenteditable=true]')].map(e => ({ cls: (e.className || '').toString().slice(0, 40), ph: (e.dataset && e.dataset.placeholder || '').slice(0, 40) })),
    btns: [...document.querySelectorAll('button, input[type=submit], a')].filter(e => e.offsetParent !== null).map(e => (e.innerText || e.value || '').trim()).filter(t => t && t.length < 25).slice(0, 20),
    body: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 250)
  })`);
  console.log('write:', st);
  await shot('sv_write');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
