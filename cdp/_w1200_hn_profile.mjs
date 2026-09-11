// _w1200_hn_profile.mjs — win1200: hashnode 补资料(bio) — 账号#466活号
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
  await cdp.send('Page.navigate', { url: 'https://hashnode.com/settings' });
  await sleep(12000);
  console.log('url:', await cdp.eval('location.href.slice(0, 80)'));
  const st = await cdp.eval(`JSON.stringify({
    textareas: [...document.querySelectorAll('textarea')].filter(e => e.offsetParent !== null).map(e => ({ n: e.name, id: e.id, ph: (e.placeholder || '').slice(0, 40), val: (e.value || '').slice(0, 50) })),
    inputs: [...document.querySelectorAll('input')].filter(e => e.offsetParent !== null && (e.name || '').match(/name|bio|location|tagline/i)).map(e => ({ n: e.name, val: (e.value || '').slice(0, 40) })),
    btns: [...document.querySelectorAll('button')].filter(e => e.offsetParent !== null).map(e => (e.innerText || '').trim()).filter(t => /save|update/i.test(t)).slice(0, 5),
    body: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 200)
  })`);
  console.log('settings:', st);
  await shot('hn_settings');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
