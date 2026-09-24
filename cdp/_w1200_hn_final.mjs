// _w1200_hn_final.mjs — win1200: hackernoon 最终提交(SUBMIT STORY→Yes)并验证
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
const realClick = async (evalFn) => {
  const p = await cdp.eval(evalFn);
  if (p === 'null' || p === 'none') return false;
  const { x, y } = JSON.parse(p);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  return true;
};

try {
  // 回编辑器重新进入submit流(上轮可能停在preview)
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 点 SUBMIT STORY / Submit Story for Review! (两种形态都试)
  let clicked = await realClick(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => /submit story/i.test(b.innerText) && b.offsetParent !== null);
    if (!b) return 'null';
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  console.log('submit-click:', clicked);
  await sleep(6000);
  // 确认模态 Yes
  const yes = await realClick(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => /^yes$/i.test(b.innerText.trim()) && b.offsetParent !== null);
    if (!b) return 'null';
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  console.log('confirm-yes:', yes);
  await sleep(10000);
  const st = await cdp.eval(`JSON.stringify({ url: location.href, body: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500) })`);
  console.log('after:', st);
  await shot('hn_final');
} catch (e) { console.error('ERR', e.message); await shot('hn_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
