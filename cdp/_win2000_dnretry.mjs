import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const DESC = "SPRAVS reviews phone chargers, cables, GaN adapters and wireless charging pads with real-world speed tests. Practical guides cover fast-charge standards, power bank picks and battery health tips. Every recommendation is based on measured charging speeds, heat buildup and long-term durability, so readers can pick the right charger with confidence.";
console.log('desc2:', await c.evalT(`(() => { const el = document.querySelector('#submitpro_desc'); if (!el) return 'no-el'; el.scrollIntoView({block:'center'}); el.focus(); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(el, ${JSON.stringify(DESC)}); el.dispatchEvent(new Event('input', {bubbles:true})); return 'ok:' + el.value.length; })()`, 8000));
// address 也补上
await c.evalT(`(() => { const el = document.querySelector('#submitpro_address'); if (!el) return 'no'; const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, 'San Francisco, CA 94103'); el.dispatchEvent(new Event('input', {bubbles:true})); return 'ok'; })()`, 6000);
// 滚到 anchor 点复选框
const ap = await c.evalT(`(() => { const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src)); a.scrollIntoView({block:'center'}); const r = a.getBoundingClientRect(); return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height }); })()`, 6000);
const a = JSON.parse(ap);
await sleep(800);
// checkbox 在 anchor iframe 内: recaptcha 复选框位于 iframe 内左侧, 30px 处
await click(a.x + 30, a.y + a.h / 2);
console.log('clicked checkbox at', Math.round(a.x + 30), Math.round(a.y + a.h / 2));
await sleep(5000);
const st = await c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); const tok = document.querySelector('textarea[name=g-recaptcha-response]'); return JSON.stringify({ bf: b ? b.getBoundingClientRect().toJSON() : null, tokLen: tok ? tok.value.length : -1, scrollY: scrollY }); })()`, 6000);
console.log('状态:', st);
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
fs.writeFileSync('D:/Github/backlink_skills/cdp/_win2000_dn_page3.jpg', Buffer.from(shot.data, 'base64'));
console.log('page3 saved');
