// _w1200_usoia_check.mjs — win1200: 9224渲染usoia目录页搜QR条目(curl看不到JS渲染)
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
  await cdp.send('Page.navigate', { url: 'https://usoia.com.br/ferramentas?search=qrcode' });
  await sleep(15000);
  // 若有搜索框则触发一次输入搜索(SPA过滤)
  const st = await cdp.eval(`(() => {
    const inp = [...document.querySelectorAll('input[type=search], input[name*=search i], input[placeholder*=search i], input[placeholder*=busca i]')].find(e => e.offsetParent !== null);
    return JSON.stringify({ hasSearch: !!inp, bodyHead: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 300) });
  })()`);
  console.log('page:', st);
  // 直接全文找QR条目
  const found = await cdp.eval(`(() => {
    const t = document.body.innerText;
    const idx = t.toLowerCase().indexOf('qrcode');
    const idx2 = t.toLowerCase().indexOf('qr code');
    return JSON.stringify({ qrcode: idx >= 0 ? t.slice(Math.max(0, idx - 80), idx + 120) : null, qrcodeSp: idx2 >= 0 ? t.slice(Math.max(0, idx2 - 80), idx2 + 120) : null });
  })()`);
  console.log('found:', found);
  await shot('usoia_search');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
