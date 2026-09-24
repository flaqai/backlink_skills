// _w1200_hn_bio.mjs — win1200: hashnode 补bio+保存
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
  await cdp.eval(`(() => {
    const e = document.querySelector('#about');
    if (!e) throw 0;
    e.focus();
    const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    set.call(e, 'Notes on free online tools, small web utilities, and hands-on software experiments.');
    e.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(1000);
  console.log('about-val:', await cdp.eval(`document.querySelector('#about').value.slice(0, 60)`));
  const b = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button')].find(x => /save changes/i.test(x.innerText) && x.offsetParent !== null);
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), disabled: btn.disabled });
  })()`);
  const B = JSON.parse(b);
  console.log('save-btn:', JSON.stringify(B));
  if (B.disabled) { console.log('按钮禁用(可能值没进React state), 试insertText'); }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: B.x, y: B.y });
  await sleep(120);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: B.x, y: B.y, button: 'left', clickCount: 1 });
  await sleep(6000);
  const after = await cdp.eval(`JSON.stringify({ toast: (document.querySelector('[class*=toast], [class*=Toast], [role=status]') || {}).innerText || '', btnStill: [...document.querySelectorAll('button')].some(x => /save changes/i.test(x.innerText) && !x.disabled) })`);
  console.log('after-save:', after);
  await shot('hn_bio');
} catch (e) { console.error('ERR', e.message); await shot('hn_bioerr').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
