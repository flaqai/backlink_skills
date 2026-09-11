// _w1200_sv_new.mjs — win1200: svbtle dashboard→New entry 编辑器定位
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
  await cdp.send('Page.navigate', { url: 'https://svbtle.com/dashboard' });
  await sleep(10000);
  const links = await cdp.eval(`JSON.stringify([...document.querySelectorAll('a')].map(a => ({ t: a.innerText.trim().slice(0, 20), h: a.href })).filter(x => /new|entry|write|edit/i.test(x.t + x.h)).slice(0, 10))`);
  console.log('links:', links);
  const L = JSON.parse(links);
  const ne = L.find(x => /new entry/i.test(x.t)) || L[0];
  if (ne) {
    await cdp.send('Page.navigate', { url: ne.h });
    await sleep(10000);
    const ed = await cdp.eval(`JSON.stringify({
      url: location.href,
      inputs: [...document.querySelectorAll('input, textarea')].filter(e => e.offsetParent !== null).map(e => ({ t: e.type || e.tagName, ph: (e.placeholder || '').slice(0, 40), n: e.name, id: e.id })),
      ce: [...document.querySelectorAll('[contenteditable=true]')].map(e => ({ cls: (e.className || '').toString().slice(0, 50), ph: (e.dataset && e.dataset.placeholder || '') })),
      btns: [...document.querySelectorAll('button, input[type=submit]')].filter(e => e.offsetParent !== null).map(e => ({ id: e.id, t: (e.innerText || e.value || '').trim() })).slice(0, 10)
    })`);
    console.log('editor:', ed);
    await shot('sv_editor');
  }
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
