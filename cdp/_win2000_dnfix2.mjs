// 补填 desc(textarea) — Illegal invocation 修复: 用 textarea 原型 setter
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const raw = fs.readFileSync('_win1800_dn_t9.txt', 'utf8');
const nl = raw.indexOf('\n');
const desc = raw.slice(nl + 1).trim();
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Runtime.enable');
console.log('desc注入:', await c.evalT(`(() => { const el = document.querySelector('#submitpro_desc'); if (!el) return 'no-el'; el.scrollIntoView({block:'center'}); el.focus(); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(el, ${JSON.stringify(desc)}); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); return 'ok:' + el.value.length; })()`, 8000));
console.log('回读:', await c.evalT(`JSON.stringify({ descLen: ((document.querySelector('#submitpro_desc')||{}).value||'').length })`, 5000));
