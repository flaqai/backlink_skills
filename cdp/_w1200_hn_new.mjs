// _w1200_hn_new.mjs — win1200: /new 页全量文本+Finish What You Started 草稿链接
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

try {
  await cdp.send('Page.navigate', { url: 'https://hackernoon.com/new' });
  await sleep(12000);
  // 滚到底触发懒加载
  for (let i = 0; i < 6; i++) { await cdp.eval('window.scrollTo(0, document.body.scrollHeight)'); await sleep(1200); }
  const info = await cdp.eval(`(() => {
    const links = [...document.querySelectorAll('a[href]')].map(a => a.innerText.trim().slice(0, 60) + ' => ' + a.href).filter(s => /draft|edit|story|mobile|finish/i.test(s));
    const fin = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /finish what you started/i.test(e.innerText)).map(e => {
      let p = e.closest('div[class]'); let out = [];
      for (let i = 0; i < 6 && p; i++) { p = p.parentElement; }
      return out;
    });
    return JSON.stringify({ links: [...new Set(links)].slice(0, 20), bodyLen: document.body.innerText.length, tail: document.body.innerText.slice(-1200) });
  })()`);
  console.log(info);
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
