// _w1200_hn_login2.mjs — win1200: hackernoon 登录诊断(checkbox+错误文本+截图)
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL = 'hackernoon@92ng.com';
const PASS = 'Xx@Hackernoon26!Xm';

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
  await cdp.send('Page.navigate', { url: 'https://hackernoon.com/login' });
  await sleep(10000);
  // 勾选可见的 checkbox
  const cb = await cdp.eval(`(() => {
    const c = [...document.querySelectorAll('input[type=checkbox]')].find(x => x.offsetParent !== null && !x.checked);
    if (!c) return 'none';
    c.scrollIntoView({ block: 'center' });
    const r = c.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  if (cb !== 'none') {
    const { x, y } = JSON.parse(cb);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
    await sleep(800);
    console.log('checkbox clicked');
  }
  await typeSmart(cdp, '#email', EMAIL);
  await typeSmart(cdp, '#password', PASS);
  const b = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /log.?in/i.test(b.innerText || '') && b.offsetParent !== null);
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  const { x, y } = JSON.parse(b);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  await sleep(10000);
  const st = await cdp.eval(`JSON.stringify({ url: location.href, err: (document.querySelector('[class*="error"], [class*="alert"], [role="alert"]')||{}).innerText || '', body: document.body.innerText.slice(0, 250) })`);
  console.log('after:', st);
  await shot('hn_diag');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
