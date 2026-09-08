import { CDP, sleep } from './CDP.mjs';
const domain = process.argv[2];
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(domain) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const s = await cdp.evalT(`(() => {
  const bf = document.querySelector('iframe[src*="api2/bframe"], iframe[src*="reloads/bframe"]');
  if (!bf) return 'NOBFRAME';
  const r = bf.getBoundingClientRect();
  const se = window.visualViewport ? window.visualViewport.scale : 1;
  return JSON.stringify({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vv: se, dpr: window.devicePixelRatio, inner: window.innerWidth});
})()`, 8000);
console.log(s);
const cap = await cdp.send('Page.captureScreenshot', { format: 'png' });
require_fs();
function require_fs(){ const fs = require('fs'); fs.writeFileSync('D:/Github/seoadminC/storage/_win2000_fresh.png', Buffer.from(cap.data, 'base64')); }
console.log('fresh shot saved');
process.exit(0);
