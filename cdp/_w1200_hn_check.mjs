// _w1200_hn_check.mjs — win1200: 决定性检查 draft 是否已提交 + story settings tag 字段 + 底部模态
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
  // 1) 编辑器页: 底部模态滚动可见 + SUBMIT STORY按钮状态
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  const btnSt = await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /submit story/i.test(x.innerText));
    if (!b) return '"nobtn"';
    const r = b.getBoundingClientRect();
    return JSON.stringify({ txt: b.innerText.trim().slice(0, 30), disabled: b.disabled, cls: (b.className || '').slice(0, 80), y: Math.round(r.y) });
  })()`);
  console.log('submit-btn:', btnSt);
  // 底部模态区域截图(滚到底)
  await cdp.eval('window.scrollTo(0, document.body.scrollHeight)');
  await sleep(2000);
  const modalTxt = await cdp.eval(`(() => {
    const m = [...document.querySelectorAll('div')].filter(e => e.offsetParent !== null && /confirm/i.test(e.innerText) && e.innerText.length < 200);
    return JSON.stringify(m.map(e => e.innerText.replace(/\\s+/g, ' ').slice(0, 150)));
  })()`);
  console.log('modal:', modalTxt);
  await shot('hn_modal');

  // 2) drafts 列表: 该draft是否还在
  await cdp.send('Page.navigate', { url: 'https://hackernoon.com/new' });
  await sleep(12000);
  const drafts = await cdp.eval(`JSON.stringify([...document.querySelectorAll('a[href*="/drafts/"]')].map(a => a.href))`);
  console.log('drafts-left:', drafts);
} catch (e) { console.error('ERR', e.message); await shot('hn_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
