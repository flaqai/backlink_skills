import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200: 按tabId截图 — node _w1200_shotid.mjs <tabId> <outfile>
const [tabId, out] = process.argv.slice(2);
const ws = new WebSocket((await (await fetch('http://127.0.0.1:9224/json/list')).json()).find(t => t.id.startsWith(tabId)).webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await sleep(1200);
const st = await cdp.eval(`(() => {
  const vis = [...document.querySelectorAll('iframe[src*="recaptcha"]')].map(f => ({s: f.src.slice(0,60), w: Math.round(f.getBoundingClientRect().width), h: Math.round(f.getBoundingClientRect().height)}));
  return JSON.stringify({url: location.href.slice(0,60), iframes: vis});
})()`);
console.log(st);
const r = await cdp.send('Page.captureScreenshot', {});
fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
console.log('SHOT', out);
ws.close();
