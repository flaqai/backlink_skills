// _w1200_hn_sso.mjs — win1200: app.hackernoon.com 经 Start Writing 走 SSO 进 app 会话
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
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/' });
  await sleep(12000);
  const link = await cdp.eval(`(() => {
    const a = [...document.querySelectorAll('a, button')].find(e => /start writing/i.test(e.innerText) && e.offsetParent !== null);
    if (!a) return 'null';
    a.scrollIntoView({ block: 'center' });
    const r = a.getBoundingClientRect();
    return JSON.stringify({ href: a.href || '', x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  console.log('start-writing:', link);
  if (link !== 'null') {
    const L = JSON.parse(link);
    if (L.href && L.href.startsWith('http')) {
      await cdp.send('Page.navigate', { url: L.href });
    } else {
      for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: L.x, y: L.y, button: 'left', clickCount: 1 });
    }
    await sleep(12000);
    console.log('landed:', await cdp.eval('location.href'));
    const st = await cdp.eval(`document.body.innerText.slice(0, 300)`);
    console.log('state:', st.replace(/\n/g, ' | ').slice(0, 300));
    await shot('hn_sso');
  }
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
