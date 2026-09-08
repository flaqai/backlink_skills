import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`).catch(()=>{});
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej('ws'), 6000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 刷新页面重置挑战状态 → 重填表单 → 触发
await c.goto('https://directorynode.com/submit-directory/', 30000);
await sleep(6000);
// 快填全表单
const DESC = "SPRAVS reviews phone chargers, cables, GaN adapters and wireless charging pads with real-world speed tests. Practical guides cover fast-charge standards, power bank picks and battery health tips. Every recommendation is based on measured charging speeds, heat buildup and long-term durability, so readers can pick the right charger with confidence.";
const r = await Promise.race([
  c.evalT(`(() => {
    const set = (sel, val, ta) => { const el = document.querySelector(sel); if (!el) return 'no:'+sel; const s = Object.getOwnPropertyDescriptor((ta?HTMLTextAreaElement:HTMLInputElement).prototype, 'value').set; s.call(el, val); el.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; };
    const out = [];
    out.push(set('#articleUrl', 'https://spravs.com'));
    out.push(set('#submitpro_title', 'SPRAVS - Phone Charger Reviews and Charging Guides'));
    const cat = document.querySelector('#submitpro_category'); if (cat) { cat.value = '9'; cat.dispatchEvent(new Event('change', {bubbles:true})); }
    const loc = document.querySelector('#submitpro_location'); if (loc) { const usa = Array.from(loc.options).find(o => /united states/i.test(o.textContent)); if (usa) loc.value = usa.value; loc.dispatchEvent(new Event('change', {bubbles:true})); }
    out.push(set('#submitpro_email', 'dn@92ng.com'));
    out.push(set('#submitpro_phone', '4155550101'));
    out.push(set('#submitpro_desc', ${JSON.stringify(DESC)}, true));
    const cb = document.querySelector('#agree-checkbox'); if (cb && !cb.checked) cb.click();
    return JSON.stringify(out);
  })()`, 10000),
  new Promise(r2 => setTimeout(() => r2('TIMEOUT'), 11000))
]);
console.log('填表:', r);
// 滚 anchor 点框
const ap = await Promise.race([
  c.evalT(`(() => { const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src)); a.scrollIntoView({block:'center'}); const rc = a.getBoundingClientRect(); return JSON.stringify({x:rc.x,y:rc.y,w:rc.width,h:rc.height}); })()`, 8000),
  new Promise(r2 => setTimeout(() => r2('TIMEOUT'), 9000))
]);
console.log('anchor:', ap);
if (ap !== 'TIMEOUT') {
  const a = JSON.parse(ap);
  await sleep(600);
  await click(a.x + 30, a.y + a.h / 2);
  await sleep(5000);
  const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 75 });
  fs.writeFileSync('D:/Github/backlink_skills/cdp/_win2000_dn_last.jpg', Buffer.from(shot.data, 'base64'));
  console.log('LAST SHOT SAVED');
}
