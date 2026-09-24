// _w1200_pe_verify.mjs — win1200: posteezy 线上锚链渲染验证
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

try {
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/ai-video-generator-free-what-free-tiers-actually-give-you-2026' });
  await sleep(12000);
  const v = await cdp.eval(`(() => {
    const anchors = [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /aivideogeneratorfree|aiimageeditorfree/.test(h));
    return JSON.stringify({ anchors: [...new Set(anchors)], bodyHas: document.body.innerText.includes('AI Video Generator Free') });
  })()`);
  console.log('verify:', v);
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
