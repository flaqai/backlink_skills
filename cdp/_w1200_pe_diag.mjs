// _w1200_pe_diag.mjs — win1200: posteezy正文渲染形态诊断
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
    const art = document.querySelector('article, .node__content, main') || document.body;
    return JSON.stringify({
      h2count: art.querySelectorAll('h2').length,
      pcount: art.querySelectorAll('p').length,
      literalTags: art.innerHTML.includes('&lt;p&gt;') || art.innerHTML.includes('&lt;a '),
      aivideogStr: art.innerHTML.indexOf('aivideogeneratorfree.org'),
      sample: art.innerText.replace(/\\s+/g, ' ').slice(0, 200)
    });
  })()`);
  console.log('render:', v);
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
